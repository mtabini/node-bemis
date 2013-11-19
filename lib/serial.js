var async = require('async');
var assert = require('assert');
var util = require('util');

var Transaction = function BemisSerialTransaction() {
  this.chain = [];
}

Transaction.prototype.addTask = function addRollbackStepToTransaction(closure) {
  assert((typeof closure === 'function') || closure._bemisClosure);
  
  this.chain.push(closure._bemisClosure ? closure._bemisClosure : closure);
};

Transaction.prototype.addParallelTasks = function addParallelStepsToTransaction(closures) {
  assert(util.isArray(closures));
  
  this.chain.push(function(cb) {
    async.parallel(closures, cb);
  });
};

Transaction.prototype.addSerialTasks = function addSerialStepsToTransactions(closures) {
  assert(util.isArray(closures));
  
  this.chain.push(function(cb) {
    async.series(closures, cb);
  });
};

Transaction.prototype.rollback = function rollbackSerialTransaction(cb) {
  assert(typeof cb === 'function');
  
  async.series(this.chain.reverse(), cb);
};

Object.defineProperty(
  Transaction.prototype,
  '_bemisClosure',
  {
    get: function() {
      return this.rollback.bind(this);
    }
  }
);

module.exports = Transaction;