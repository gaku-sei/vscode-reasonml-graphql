export type RawSchema = {
  content: string;
  type: "json" | "sdl";
};

export type SchemaLoader = (
  rootPath: string,
  filesInRoot: Array<string>
) => Promise<RawSchema | null>;

export type GraphQLSourceFromFullDocument = {
  type: "FULL_DOCUMENT";
  content: string;
};

export type GraphQLSourceFromTag = {
  type: "TAG";
  content: string;
  start: {
    line: number;
    character: number;
  };
  end: {
    line: number;
    character: number;
  };
};

export type GraphQLSource =
  | GraphQLSourceFromFullDocument
  | GraphQLSourceFromTag;

export type InsertGraphQLComponentType =
  | "Fragment"
  | "Query"
  | "Mutation"
  | "Subscription";

export type Framework = "ReasonRelay" | "graphql_ppx";
