const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/utils");
const bcrypt = require("bcryptjs");
const auth = require("../utils/auth");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "dummyTable";

async function login(user) {
  const username = user.username;
  const password = user.password;

  //all fields are mandatory
  if (!username || !password) {
    return util.buildResponse(401, {
      message: "Username and password are required",
    });
  }

  //user not exist
  const dynamoUser = await getUser(username.toLowerCase().trim());
  if (!dynamoUser || !dynamoUser.username) {
    return util.buildResponse(403, {
      message: "User doesnot exist",
    });
  }

  // incorrect pswd
  if (!bcrypt.compareSync(password, dynamoUser.password)) {
    return util.buildResponse(403, {
      message: "password is incorrect",
    });
  }

  //userinfo with access
  const userInfo = {
    username: dynamoUser.username,
    name: dynamoUser.name,
  };
  const token = auth.generateToken(userInfo);
  const response = {
    user: userInfo,
    token: token,
  };
  return util.buildResponse(200, response);
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

module.exports.login = login;
