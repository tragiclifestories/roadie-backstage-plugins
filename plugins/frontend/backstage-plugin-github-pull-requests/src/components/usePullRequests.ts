/*
 * Copyright 2020 RoadieHQ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useContext, useEffect, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { githubPullRequestsApiRef } from '../api/GithubPullRequestsApi';
import { useApi, githubAuthApiRef } from '@backstage/core-plugin-api';
import { RequestError } from "@octokit/request-error";
import moment from 'moment';
import { PrState, PullRequestState } from '../types';
import { useBaseUrl } from './useBaseUrl';
import { GithubPullRequestsContext } from "./PullRequestsContext"

export function usePullRequests({
  owner,
  repo,
  branch,
  state,
  pageSize,
}: {
  owner: string;
  repo: string;
  branch?: string;
  state: PullRequestState;
  pageSize?: number;
}) {
  const api = useApi(githubPullRequestsApiRef);
  const auth = useApi(githubAuthApiRef);
  const baseUrl = useBaseUrl();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const { prState, setPrState } = useContext(GithubPullRequestsContext)
  const getElapsedTime = (start: string) => {
    return moment(start).fromNow();
  };

  const [{ loading, error }, doFetch] = useAsyncFn(async () => {

    try {
      const token = await auth.getAccessToken(['repo']);
      const {
        maxTotalItems,
        pullRequestsData,
        etag
      } = await api.listPullRequests({
        token,
        owner,
        repo,
        pageSize,
        page: page + 1,
        branch,
        state,
        baseUrl,
        etag: state && prState[state].etag || ""
      })
      if (maxTotalItems) {
        setTotal(maxTotalItems);
      }
      if (etag) {
        setPrState((current: PrState) => ({
          ...current,
          ...{ [state]: { ...current[state], etag } }
        }))

      }

      return pullRequestsData.map(
        ({
          id,
          html_url,
          title,
          number,
          created_at,
          updated_at,
          user,
          state: pr_state,
          draft,
          merged_at,
          closed_at
        }) => ({
          url: html_url,
          id,
          number,
          title,
          state: pr_state,
          draft,
          merged: merged_at,
          created_at,
          closed_at,
          creatorNickname: user.login,
          creatorProfileLink: user.html_url,
          createdTime: getElapsedTime(created_at),
          updatedTime: getElapsedTime(updated_at),
        }),
      );
    }
    catch (e) {
      if (e instanceof RequestError) {
        if (e.status !== 304) {
          throw e
        }
        return prState[state].data
      }
    }
  },
    [page, repo, owner, state, pageSize]);
  useEffect(() => {
    setPage(0);
    (async () => {
      const pullRequests = await doFetch();
      if (pullRequests) {
        setPrState((current: PrState) => ({
          ...current,
          ...{ [state]: { ...current[state], data: pullRequests } }
        }))
      }

    })()
  }, [state, page, repo, owner, pageSize]);
  return [
    {
      page,
      loading,
      prData: prState[state].data,
      projectName: `${owner}/${repo}`,
      total,
      error,
    },
    {
      setPage,
    },
  ] as const;
}
