// @ts-nocheck  <-- Disables TypeScript checks in this file

import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useMemo,
} from 'react';
import AutoSizerDefault from 'react-virtualized-auto-sizer';
import {
  FixedSizeList as OriginalFixedSizeList,
  FixedSizeListProps,
  ListChildComponentProps,
} from 'react-window';
import { TokenInfo } from '@solana/spl-token-registry';
import debounce from 'lodash.debounce';
import { useMutation, useQuery } from '@tanstack/react-query';

import LeftArrowIcon from 'src/icons/LeftArrowIcon';
import SearchIcon from 'src/icons/SearchIcon';
import FormPairRow from './FormPairRow';
import { useTokenContext } from 'src/contexts/TokenContextProvider';
import { useSortByValue } from './useSortByValue';
import { searchService } from 'src/contexts/SearchService';
import { useAccounts } from 'src/contexts/accounts';
import { cn } from 'src/misc/cn';

export const PAIR_ROW_HEIGHT = 72;
const SEARCH_BOX_HEIGHT = 56;

interface MyAutoSizerProps {
  children: (size: { height: number; width: number }) => React.ReactNode;
}
const MyAutoSizer = AutoSizerDefault as unknown as React.FC<MyAutoSizerProps>;

const MyFixedSizeList = forwardRef(function MyFixedSizeList(
  props: FixedSizeListProps<any>,
  ref,
) {
  return <OriginalFixedSizeList {...props} ref={ref} />;
});

interface IFormPairSelector {
  onSubmit: (value: TokenInfo) => void;
  onClose: () => void;
  tokenInfos: TokenInfo[];
}

export default function FormPairSelector({
  onSubmit,
  tokenInfos,
  onClose,
}: IFormPairSelector) {
  const { tokenMap } = useTokenContext();
  const { sortTokenListByBalance, mintToUsdValue } = useSortByValue();

  const { data: blueChipTokens } = useQuery({
    queryKey: ['blueChipTokens'],
    queryFn: () => searchService.search(''),
    staleTime: 5 * 60 * 1000,
  });

  const { accounts: userAccounts, loading: isInitialLoading } = useAccounts();
  const { data: userBalanceTokens } = useQuery({
    queryKey: ['userBalanceTokens', userAccounts],
    queryFn: async () => {
      const userMints = Object.keys(userAccounts).filter((key) =>
        userAccounts[key].balanceLamports.gtn(0),
      );
      return searchService.getUserBalanceTokenInfo(userMints);
    },
    enabled: Object.keys(userAccounts).length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { mutateAsync: performSearch, isLoading } = useMutation(
    async (value: string) => {
      const response = await searchService.search(value);
      return response;
    }
  );

  const searchValue = useRef<string>('');
  const [searchResult, setSearchResult] = useState<TokenInfo[]>(tokenInfos);

  const doSearch = useCallback(
    async (value: string) => {
      if (!value) {
        const combined = await sortTokenListByBalance([
          ...(blueChipTokens || []),
          ...(userBalanceTokens || []),
        ]);
        setSearchResult(combined);
        return;
      }
      const results = await performSearch(value);
      setSearchResult(results);
      results.forEach((item) => tokenMap.set(item.address, item));
    },
    [blueChipTokens, userBalanceTokens, sortTokenListByBalance, performSearch, tokenMap],
  );

  const triggerSearch = useMemo(() => {
    return debounce((value: string) => {
      void doSearch(value);
    }, 200);
  }, [doSearch]);

  const onChange = useCallback(
    (e) => {
      setSearchResult([]);
      searchValue.current = e.target.value;
      triggerSearch(e.target.value);
    },
    [triggerSearch],
  );

  const inputRef = createRef();
  const listRef = createRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  useEffect(() => {
    if (!isInitialLoading) {
      triggerSearch(searchValue.current);
    }
  }, [triggerSearch, isInitialLoading]);

  return (
    <div className="flex flex-col h-full w-full py-4 px-2 bg-black">
      {/* Header */}
      <div className="flex w-full justify-between">
        <div
          className="text-white fill-current w-6 h-6 cursor-pointer"
          onClick={onClose}
        >
          <LeftArrowIcon width={24} height={24} />
        </div>
        <div className="text-white">Select Token</div>
        <div className="w-6 h-6" />
      </div>

      {/* Search Box */}
      <div
        className="flex px-5 mt-4 w-[98%] rounded-xl bg-v2-lily/10"
        style={{ height: SEARCH_BOX_HEIGHT, maxHeight: SEARCH_BOX_HEIGHT }}
      >
        <SearchIcon />
        <input
          autoComplete="off"
          className="w-full rounded-xl ml-4 truncate bg-transparent text-white/50 placeholder:text-white/20"
          placeholder="Search"
          onChange={onChange}
          ref={inputRef}
        />
      </div>

      {/* Results */}
      <div className="mt-2" style={{ flexGrow: 1 }}>
        {searchResult.length > 0 && (
          <MyAutoSizer>
            {({ height, width }) => (
              <MyFixedSizeList
                ref={listRef}
                height={height}
                width={width - 2}
                itemCount={searchResult.length}
                itemSize={72}
                itemData={{ searchResult, onSubmit, mintToUsdValue }}
                className={cn(
                  'overflow-y-scroll mr-1 min-h-[12rem] px-5 webkit-scrollbar',
                )}
              >
                {(props) => {
                  const { data, index, style } = props;
                  const item: TokenInfo = data.searchResult[index];

                  return (
                    <FormPairRow
                      key={item.address}
                      item={item}
                      style={style}
                      onSubmit={data.onSubmit}
                      usdValue={data.mintToUsdValue.get(item.address)}
                    />
                  );
                }}
              </MyFixedSizeList>
            )}
          </MyAutoSizer>
        )}

        {isLoading ? (
          <div className="mt-4 mb-4 text-center text-white/50">
            <span>Loading...</span>
          </div>
        ) : searchResult.length === 0 ? (
          <div className="mt-4 mb-4 text-center text-white/50">
            <span>No tokens found</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
