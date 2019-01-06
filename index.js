const { ApolloServer, gql } = require('apollo-server');
const faker = require('faker');
const arrayUniq = require('array-uniq');

const authors = new Array(20).fill(0).map((_, index) => {
  return {
    id: index + 1,
    name: faker.lorem.words(2),
    email: faker.internet.email(),
    bio: faker.lorem.paragraph(),
  };
});

const publishers = new Array(30).fill(0).map((_, index) => {
  return {
    id: index + 1,
    name: faker.lorem.words(3),
  };
});

const books = new Array(100).fill(0).map((_, index) => {
  return {
    id: index + 1,
    title: faker.lorem.words(4),
    isbn: faker.random.number({ min: 100000, max: 10000000 }),
    author_ids: arrayUniq([
      faker.random.arrayElement(authors.map(author => author.id)),
      faker.random.arrayElement(authors.map(author => author.id)),
      faker.random.arrayElement(authors.map(author => author.id)),
    ]),
    publisher_id: faker.random.arrayElement(
      publishers.map(publisher => publisher.id)
    ),
  };
});

const typeDefs = gql`
  type Author {
    id: Int
    name: String
    email: String
    bio: String
    books(page: Int, quantity: Int): [Book!]!
  }

  type Publisher {
    id: Int
    name: String
    books(page: Int, quantity: Int): [Book!]!
  }

  type Book {
    id: Int
    title: String
    isbn: Int
    author_ids: [Int!]
    authors(page: Int, quantity: Int): [Author!]
    publisher_id: Int
    publisher: Publisher
  }

  type Query {
    authors(page: Int, quantity: Int): [Author]
    publishers(page: Int, quantity: Int): [Publisher]
    books(page: Int, quantity: Int): [Book]
  }
`;

const getPagedResults = (arr, page, quantity) => {
  const start_index = (page - 1) * quantity;
  return arr.slice(start_index, start_index + quantity);
};

const resolvers = {
  Query: {
    authors: (_, args) => {
      const { page = 1, quantity = 10 } = args;
      return getPagedResults(authors, page, quantity);
    },
    publishers: (_, args) => {
      const { page = 1, quantity = 10 } = args;
      return getPagedResults(publishers, page, quantity);
    },
    books: (_, args) => {
      const { page = 1, quantity = 10 } = args;
      return getPagedResults(books, page, quantity);
    },
  },
  Author: {
    books: (author, args) => {
      const { page = 1, quantity = 10 } = args;
      return getPagedResults(
        books.filter(book => book.author_ids.includes(author.id)),
        page,
        quantity
      );
    },
  },
  Book: {
    authors: (book, args) => {
      const { page = 1, quantity = 10 } = args;
      const { author_ids } = book;
      return getPagedResults(
        author_ids
          .map(author_id => {
            return authors.find(author => author_id === author.id);
          })
          .filter(author => !!author),
        page,
        quantity
      );
    },
    publisher: book => {
      const { publisher_id } = book;
      return publishers.find(publisher => publisher.id === publisher_id);
    },
  },
  Publisher: {
    books: (publisher, args) => {
      const { page = 1, quantity = 10 } = args;
      return getPagedResults(
        books.filter(book => book.publisher_id === publisher.id),
        page,
        quantity
      );
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
