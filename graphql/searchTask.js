import { gql } from 'graphql-tag';

const typeDefs = gql`
  type Gig {
    id: ID!
    title: String!
    description: String!
    skillCategory: String
    budgetMin: Float
    budgetMax: Float
    location: String
    createdAt: String
  }

  type Query {
    searchGigs(
      query: String
      skillCategory: String
      budgetMin: Float
      budgetMax: Float
      location: String
      datePosted: String
    ): [Gig]
  }
`;

export default typeDefs;
