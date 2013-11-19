var expect = require('chai').expect;

var Bemis = require('../index');

describe('The serial transaction class', function() {
  
  it('should exist', function() {
    expect(Bemis.Serial).to.be.a('function');
  });
  
  it('should allow adding tasks', function() {
    var transaction = new Bemis.Serial();
    
    expect(transaction.addTask).to.be.a('function');
  });
  
  it('should properly roll back a transaction', function(done) {
    var transaction = new Bemis.Serial();
    
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
  
  it('should serialize the rollback operation', function(done) {
    var transaction = new Bemis.Serial();
    
    var result = '';
    
    transaction.addTask(function(cb) {
      result += '2';
      cb();
    });
    
    transaction.addTask(function(cb) {
      setTimeout(function() {
        result += '1';
        cb();
      }, 200);
    });
    
    transaction.rollback(function() {
      expect(result).to.be.a('string');
      expect(result).to.equal('12');
      
      done();
    });
  });
  
  it('should allow nesting transactions', function(done) {
    var transaction = new Bemis.Serial();
    
    var result = '';
    
    var innerTransaction = new Bemis.Serial();
    
    innerTransaction.addTask(function(cb) {
      result += '2';
      cb();
    });
    
    innerTransaction.addTask(function(cb) {
      result += '1';
      cb();
    });
    
    transaction.addTask(innerTransaction);
    
    transaction.addTask(function(cb) {
      result += '0';
      cb();
    });
    
    transaction.rollback(function() {
      expect(result).to.equal('012');
      
      done();
    });
  });
  
  it('should allow adding parallel tasks', function(done) {
    var transaction = new Bemis.Serial();
    
    var result = [];
    
    transaction.addParallelTasks(
      [
        function(cb) {
          result.push(1);
          cb();
        },
        
        function(cb) {
          result.push(2);
          cb();
        }
      ]
    );
    
    transaction.rollback(function() {
      expect(result).to.have.length(2);
      
      done();
    });
  });
  
  it('should allow adding serial tasks', function(done) {
    var transaction = new Bemis.Serial();
    
    var result = '';
    
    transaction.addSerialTasks(
      [
        function(cb) {
          result += '2';
          cb();
        },
        
        function(cb) {
          result += '1';
          cb();
        }
      ]
    );
    
    transaction.addTask(function(cb) {
      result += '3';
      cb();
    })
    
    transaction.rollback(function() {
      expect(result).to.equal('321');
      
      done();
    });
  });
  
});