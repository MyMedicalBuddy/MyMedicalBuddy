const AWS = require('aws-sdk');

// AWS DynamoDB Database Helper for AWS deployment
class AWSDB {
  constructor() {
    this.dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.tables = {
      users: 'Users',
      cases: 'Cases', 
      doctors: 'Doctors',
      messages: 'Messages'
    };
  }

  async addRecord(tableName, record) {
    const { v4: uuidv4 } = require('uuid');
    record.id = uuidv4();
    record.createdAt = new Date().toISOString();
    
    await this.dynamodb.put({
      TableName: this.tables[tableName],
      Item: record
    }).promise();
    
    return record;
  }

  async findRecord(tableName, criteria) {
    const key = Object.keys(criteria)[0];
    const value = criteria[key];
    
    if (key === 'email') {
      // Use GSI for email lookup
      const result = await this.dynamodb.query({
        TableName: this.tables[tableName],
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': value }
      }).promise();
      
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } else {
      // Use primary key lookup
      const result = await this.dynamodb.get({
        TableName: this.tables[tableName],
        Key: { [key]: value }
      }).promise();
      
      return result.Item;
    }
  }

  async findRecords(tableName, criteria = {}) {
    if (Object.keys(criteria).length === 0) {
      const result = await this.dynamodb.scan({
        TableName: this.tables[tableName]
      }).promise();
      return result.Items;
    }
    
    const key = Object.keys(criteria)[0];
    const value = criteria[key];
    
    const result = await this.dynamodb.query({
      TableName: this.tables[tableName],
      IndexName: `${key}-index`,
      KeyConditionExpression: `${key} = :value`,
      ExpressionAttributeValues: { ':value': value }
    }).promise();
    
    return result.Items;
  }

  async updateRecord(tableName, id, updates) {
    updates.updatedAt = new Date().toISOString();
    
    const updateExpression = 'SET ' + Object.keys(updates).map(key => `${key} = :${key}`).join(', ');
    const expressionAttributeValues = {};
    Object.keys(updates).forEach(key => {
      expressionAttributeValues[`:${key}`] = updates[key];
    });
    
    const result = await this.dynamodb.update({
      TableName: this.tables[tableName],
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    return result.Attributes;
  }
}

module.exports = AWSDB;