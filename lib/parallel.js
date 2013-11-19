var util = require('util');
var assert = require('assert');
var async = require('async');

var SerialTransaction = require('./serial');

var Transaction = function BemisParallelTransaction() {
  SerialTransaction.call(this);
}

util.inherits(Transaction, SerialTransaction);

Transaction.prototype.rollback = function rollbackParallelTransaction(cb) {
  assert(typeof cb === 'function');
  
  async.parallel(this.chain, cb);
};

module.exports = Transaction;