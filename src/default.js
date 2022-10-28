"use strict";

module.exports.handler = async (event) => {
  console.log(event);
  return {
    statusCode: 404,
    body: JSON.stringify({ message: "Route not found" })
  };
}
