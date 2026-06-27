"use strict";

const makeSchemaType = () => ({
  describe() {
    return this;
  },
  optional() {
    return this;
  },
});

const tool = (definition) => definition;

tool.schema = {
  string() {
    return makeSchemaType();
  },
  number() {
    return makeSchemaType();
  },
};

module.exports = {
  tool,
};
