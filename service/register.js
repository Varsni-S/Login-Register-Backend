const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/utils");
const bcrypt = require("bcryptjs");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "dummyTable";

async function register(userInfo) {
  const name = userInfo.name;
  const email = userInfo.email;
  const username = userInfo.username;
  const password = userInfo.password;

  //all fields are mandatory
  if (!username || !name || !email || !password) {
    return util.buildResponse(401, {
      message: "All fiels are required",
    });
  }

  //checking for already exists user in DB
  const dynamodbUser = await getUser(username.toLowerCase().trim());
  if (dynamodbUser && dynamodbUser.username) {
    return util.buildResponse(401, {
      message:
        "username already exists in our database. Please provide different name",
    });
  }

  //encrypted password the user saved password
  const encryptedPW = bcrypt.hashSync(password.trim(), 10);
  const user = {
    name: name,
    email: email,
    username: username.toLowerCase().trim(),
    password: encryptedPW,
  };

  //saving user data in db
  const saveUserResponse = await saveUser(user);
  if (!saveUserResponse) {
    return util.buildResponse(503, {
      message: "Server Error.Please try later",
    });
  }
  return util.buildResponse(200, { username: username });
}

//getuser function
async function getUser(username) {
  const params = {
    TableName: userTable,
    Key: {
      username: username, //Primary key which we set in AWS dynamodb console
    },
  };
  return await dynamodb
    .get(params)
    .promise()
    .then(
      (response) => {
        return response.Item;
      },
      (error) => {
        console.error("there is an error for getting user:", error);
      }
    );
}

//save user function
async function saveUser(user) {
  const params = {
    TableName: userTable,
    Item: user,
  };
  return await dynamodb
    .put(params)
    .promise()
    .then(
      () => {
        return true;
      },
      (error) => {
        console.error("there s an error saving user", error);
      }
    );
}

module.exports.register = register;
