export interface Range {
    from: string;
    to: string;
}

export interface ValueFilterInput {
    path: string;
    values: string[];
}

export interface RangeFilterInput {
    path: string;
    ranges: Range[];
}

export interface TreeFilterInput {
    path: string;
    rootValues: string[];
    subTreeValues: string[];
}

export interface ExistsFilterInput {
    path: string;
}

export interface SearchFilterInput {
    model :{
      value?: ValueFilterInput;
      range?: RangeFilterInput;
      tree?: TreeFilterInput;
      exists?: ExistsFilterInput;
    }
}

export interface TermsFacetInput {
    path: string;
    alias?: string;
    countProducts: boolean;
}

export interface RangeFacetInput {
    path: string;
    range: Range[];
    alias?: string;
    countProducts: boolean;
}

export interface SearchFacetInput {
    model :{
      terms?: TermsFacetInput;
      range?: RangeFacetInput;
    }
}