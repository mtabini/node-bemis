# Bemis: An asynchronous transaction manager for Node.js apps

Bemis makes it easy to perform reversable multi-step operations in a Node.js app by allowing you to progressively build a rollback operation.

## Installation

```javascript
npm install node-bemis
```

## Example usage

You use Bemis as part of a multi-step operation to create an undo process. For example, suppose you want to charge a customer and then update their order with the payment information. Normally, you'd do something like this:

```javascript
customer.charge(order.total, function(err, transaction) {
  if (err) return; // Bail
  
  order.update(transaction.details);
});
```

If the call to `order.update()` fails, your payment will be half-complete: the customer will have been charged, but the payment will not be reflected in the order (normally leading to a _very_ upset customer and lots of head scratching in your customer support department).

With Bemis, you can build a transaction reversal operation with a few lines of code:

```javascript

var transaction = new Bemis.Serial();

customer.charge(order.total, function(err, transaction) {
  if (err) return; // Bail
  
  transaction.addTask(function(cb) {
    customer.refund(order.total, cb);
  });
  
  order.update(transaction.details, function(err) {
    if (err) return transaction.rollback();
    
    // Continue as normal
  });
});
```

**Important:** Note that it's up to you to ensure the atomicity of each task. Bemis can't help you with that!

## Serial and parallel rollbacks

Bemis works asynchronously, performing each task without blocking. However, it supports two kinds of transactions:

- `Bemis.Serial` performs its tasks in reverse order, one after the other. So, if you add `Task A` and `Task B` to one, a rollback will cause `Task B` to be executed, _and then_ `Task A`.
- `Bemis.Parallel` as its name implies, performs its tasks in parallel, without guaranteeing a specific order.

## Nested transaction blocks

You can nest transaction blocks by simply adding them to each other as tasks. They will be automatically executed using the appropriate causality rules.

Nesting is useful when one of your tasks includes an indeterminate number of parallel operations that must all complete successfully; since it's impossible to predict at design time _which_ step will fail, you can simply accumulate your rollback tasks progressively and nest them in a larger overall transaction. For example, using @caolan's [async](https://github.com/caolan/async) module:

```javascript
var transaction = new Bemis.Serial();

async.series(
  [
    function(cb) {
      doSometing(function(err) {
        if (err) return cb(err);
        
        transaction.addTask(function(cb) {
          // Undo here
        });
      });
    },
      
    function(cb) {
      var parallelTransaction = new Bemis.Paralle();
      
      transaction.addTask(parallelTransaction);
      
      async.each(
        arrayWithManyItems,
        
        function(cb) {
          // There is no way of telling whether _any_ of these will fail, so we
          // simply keep populating the parallel transaction at east step.
        },
          
        cb
      );
    }  
  ],
  
  function(err) {
    if (err) return transaction.rollback(function() {
      // Do something here.
    });
  }
);
```

## API

### Bemis.Serial()

Instantiates a new serial transaction.

### Bemis.Parallel()

Instantiates a new parallel transaction. Both `Bemis.Serial` and `Bemis.Parallel` have the exact same interface.

### transaction.addTask({fn(callback)|transaction})

Adds a new task to a transaction. A task is either a callback or another transaction, which will be nested within the current transaction.

Note that the task will be performed asynchronously, and must call `callback` when it's complete.

The `callback` parameter accepts an `err` parameter, which can be null or undefined. Note that, if you pass `err`, the entire rollback operation will immediately stop.

### transaction.addParallelTasks(tasks)

Adds a an array of tasks to be executed in series as part of a single task in the rollback process. Note that these tasks are executed _exactly_ in the order in which you specify them; they are not reversed.

Each tasks is executed asynchronously and receives a callback that must be called on completion. The callback behaves exactly as in `addTask()`.

### transaction.addSerialTasks(tasks)

Adds a an array of tasks to be executed in parallel as part of a single task in the rollback process. Each tasks is executed asynchronously and receives a callback that must be called on completion. The callback behaves exactly as in `addTask()`.

### transaction.rollback([callback])

Rolls back a transaction, as described above. The optional `callback` closure, if present, is called on completion with an `err` parameter that indicates whether the rollback procedure was interrupted by an error.
