var expect = require('chai').expect;

var Bemis = require('../index');

describe('The parallel transaction class', function() {
  
  it('should exist', function() {
    expect(Bemis.Parallel).to.be.a('function');
  });
  
  it('should allow adding tasks', function() {
    var transaction = new Bemis.Parallel();
    
    expect(transaction.addTask).to.be.a('function');
  });
  
  it('should properly roll back a transaction', function(done) {
    var transaction = new Bemis.Parallel();
    
    var result = [];
    
    transaction.addTask(function(cb) {
      result.push(1);
      cb();
    });
    
    transaction.addTask(function(cb) {
      result.push(2);
      cb();
    });
    
    transaction.rollback(function() {
      expect(result).to.have.length(2);
      
      done();
    });
  });
  
  it('should parallelize the rollback operation', function(done) {
    var transaction = new Bemis.Parallel();
    
    var result = '';
    
    transaction.addTask(function(cb) {
      setTimeout(function() {
        result += '1';
        cb();
      }, 200);
    });
    
    transaction.addTask(function(cb) {
      result += '2';
      cb();
    });
    
    transaction.rollback(function() {
      expect(result).to.be.a('string');
      expect(result).to.equal('21');
      
      done();
    });
  });
  
});