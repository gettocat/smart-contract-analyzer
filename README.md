# smart-contract-analyzer
Pure js smart contract analyzer

## install

```
cd package
npm install
```


## usage

```js
const { SmartContract } = require('./package');

let contract = new SmartContract(Buffer.from(initialcode, 'hex'));
contract.deploy(['constructorParam1', 'constructorParam2', 'etc...'], {
    'callvalue': 0
})

//console.log(contract.state.hrs()) //contains state after deploy
//console.log(contract.binary) // contains code after deploy

let methodName = 'ae42e951';
let methodParams = [2, 5];
let newstate = contract.call(methodName, methodParams, {//
    'callvalue': 0
});

//console.log(newstate.state.hrs())//contains state after method call
//console.log(newstate.return)//containts return data

//let res = contract.callStatic(methodName, methodParams, {//also you can make static call
//    'callvalue': 0
//});
//res.return //return of this method call

```

## Disclamer
This is not final code, it is not worked for ERC20, need to be tested for all operations in ./state.js file. TODO.