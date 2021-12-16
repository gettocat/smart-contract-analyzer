const EventEmitter = require('events');
const { WORD2NUM, WORDBN, WORD, BN } = require('./word');
const createKeccakHash = require('keccak')

class state extends EventEmitter {

    constructor(code, laststate) {
        super();

        let inputData = {};

        if (laststate)
            this.import(laststate);
        else
            this.store = {};

        this.code = code;
        this.currentTag = 'init';
        this.lastreturn = {
            return: false,
            buffer: Buffer.from(''),
            pc: 0
        }

        this.lastrevert = {
            revert: false,
            buffer: Buffer.from(''),
            pc: 0
        };

        this.input = {
            "tx_origin": inputData.origin || WORD(0),
            "caller": inputData.caller || WORD(0),
            "callvalue": inputData.callvalue || WORD(0),
            "calldata": inputData.calldata || "",
            "calldatasize": inputData.calldatasize || WORD(0),
            "codesize": inputData.codesize || WORD(0),
            "code": inputData.code || code,
            "gasprice": inputData.gasprice || WORD(0),
            "returndatasize": inputData.returndatasize || WORD(0),
            "returndata": inputData.returndata || WORD(0),
            "block_coinbase": inputData.blockcoinbase || WORD(0),
            "block_timestamp": inputData.blocktime || WORD(parseInt(Date.now() / 1000)),
            "block_number": inputData.blocknumber || WORD(0),
            "block_difficulty": inputData.difficulty || WORD(0),
            "gaslimit": inputData.gaslimit || WORD(0)
        };

        this.stack = [];
        this.memory = Buffer.from('');
        this.history = [];
        this.address = "";
        this.gas = 0;//gas of tx, available after execution
        this.usedGas = 0;
        this.nonce = 0;
        this.pcounter = 0;
    }
    //return human-readable-state
    hrs() {
        return {
            //input: this.input,
            usedGas: this.usedGas,
            pc: this.pcounter,
            store: this.store,
            stack: this.stack,
            memory: this.memory,
            revert: {
                executed: this.lastrevert.revert,
                data: this.lastrevert.buffer,
                line: this.lastrevert.pc
            },
            return: {
                executed: this.lastreturn.return,
                data: this.lastreturn.buffer,
                line: this.lastreturn.pc
            }
        }
    }
    export() {
        return JSON.stringify(this.store)
    }
    import(zipstate) {
        this.store = JSON.parse(zipstate);
    }
    updateOptions(inputData) {
        if (!inputData)
            inputData = {};

        this.input = {
            "tx_origin": inputData.origin || this.input.origin || WORD(0),
            "caller": inputData.caller || this.input.caller || WORD(0),
            "callvalue": inputData.callvalue || this.input.callvalue || WORD(0),
            "calldata": inputData.calldata || this.input.calldata || "",
            "calldatasize": inputData.calldatasize || this.input.calldatasize || WORD(0),
            "codesize": inputData.codesize || this.input.codesize || WORD(0),
            "code": inputData.code || this.input.code || WORD(0),
            "gasprice": inputData.gasprice || this.input.gasprice || WORD(0),
            "returndatasize": inputData.returndatasize || this.input.returndatasize || WORD(0),
            "returndata": inputData.returndata || this.input.returndata || WORD(0),
            "block_coinbase": inputData.blockcoinbase || this.input.blockcoinbase || WORD(0),
            "block_timestamp": inputData.blocktime || this.input.blocktime || WORD(parseInt(Date.now() / 1000)),
            "block_number": inputData.blocknumber || this.input.blocknumber || WORD(0),
            "block_difficulty": inputData.difficulty || this.input.difficulty || WORD(0),
            "gaslimit": inputData.gaslimit || this.input.gaslimit || WORD(0)
        };
    }
    getAddress() {
        return this.address;
    }
    getNonce() {
        return this.nonce;
    }
    updateNonce() {
        return ++this.nonce;
    }
    getBalance(address) {
        return 0;
    }
    getAddressCode(address) {
        return Buffer.from("");
    }
    getBlockHash(number) {
        return "";
    }
    exec(oldoffset, command, data) {

        //let debug = [this.pcounter, command, 'before >', 'stack: ', this.stack.length, 'memory: ', this.memory.length, 'storage: ', Object.keys(this.store).length];
        //let debug = [this.pcounter, command, this.stack.join(' ').split("0000000000000000000000000000000000000000000000000000000000000000").join("0").split("00").join("")];//'before >', 'stack: ', this.stack.length, 'memory: ', this.memory.length, 'storage: ', Object.keys(this.store).length];

        this.emit("log", this.pcounter, command, this.stack.join(' ').split("0000000000000000000000000000000000000000000000000000000000000000").join("0").split("00").join(""));
        //console.log.apply(console, debug)
        let res = this._exec(oldoffset, command, data);
        this.emit("state" + this.pcounter, this.stack, this.memory.toString('hex'), this.store);
        //debug.push("| after > ", 'stack: ', this.stack.length, 'memory: ', this.memory.length, 'storage: ', Object.keys(this.store).length);

        return res;

    }
    _exec(oldoffset, command, data) {
        let diff;
        let res = command.match(/(push|dup|swap)(\d+?)/ism);

        if (res)
            if (res[0]) {
                let type = res[1];
                let num = parseInt(res[2]);
                if (!num && type == 'push')
                    num = 4;

                this.emit("pc", this.pcounter, type + num, (type == 'push') ? data : '');

                diff = state.commands['_' + type](this, num, data);
                //console.log(this.pcounter, type + num, data, this.stack);

                this.historyAdd(command, diff.history);
                this.useGas(diff.gas);

                if (type == 'push')
                    return oldoffset;//offset recalculated in reader class for this case
                return oldoffset + 1;
            }

        this.emit("pc", this.pcounter, command);

        diff = state.commands[command](this, data || null);
        //console.log(this.pcounter, command, data, this.stack);

        this.historyAdd(command, diff.history);
        this.useGas(diff.gas);

        if (diff.stop)
            return -1000;

        if (diff.offset == -2000)
            return -2000;

        if (diff.offset == -1)
            return diff.offset;

        return oldoffset + 1;
    }
    historyAdd(command, data) {
        this.emit("history", this.pcounter, data);
        data.unshift(command);
        this.history.push(data);
    }
    useGas(gas) {
        this.usedGas += gas;
        this.gas -= gas;
    }
    getLastRevertInfo() {
        return this.lastrevert;
    }
    getLastReturnInfo() {
        return this.lastreturn;
    }
    _get() {
        if (!this.stack.length)
            throw new Error('stack is empty, error!');
        let value = this.stack.pop();
        this.emit("pc", this.pcounter, "get from stack", value);
        return {
            history: ['s/get', value],
            value: value
        }
    }
    _getN(num) {//starts from 1
        let value = this.stack[this.stack.length - num];
        //this.stack.splice(this.stack.length - num, 1);//used for dup. is not remove original from stack.

        this.emit("pc", this.pcounter, "get N from stack", num, value);
        return {
            history: ['s/getN', num, value],
            value: value
        }
    }
    _swap(num) {//0 is last stack element
        let last = this.stack.length - 1;
        let item = last - num;

        let temp = this.stack[last];
        let temp2 = this.stack[item];

        this.stack[last] = this.stack[item];
        this.stack[item] = temp;

        this.emit("pc", this.pcounter, "Swap last element and N", num, temp, temp2);

        return {
            history: ['s/swap', last, num, temp, temp2]
        }
    }
    _set(value) {
        this.emit("pc", this.pcounter, "Push to stack", value);
        this.stack.push(WORD(value));
        return {
            history: ['s/set', WORD(value)],
            value: value
        }
    }

    _getmem(offset, length) {
        let val = this.memory.slice(offset, offset + length);
        this.emit("pc", this.pcounter, "Get from mem (offset,length)", offset, length, val);
        return {
            history: ['m/get', offset, length],
            value: val
        }

    }
    _setmem(offset, bytes) {
        let s;
        if (this.memory.length < bytes.length + offset) {
            let temp = Buffer.alloc(offset + bytes.length);
            temp.fill(0);
            s = temp.set(bytes.subarray(0, bytes.length), offset);
            bytes.copy(this.memory, offset);
            this.memory = temp;
        } else
            s = this.memory.set(bytes.subarray(0, bytes.length), offset);

        this.emit("pc", this.pcounter, "Set to mem (offset)", offset, bytes);

        return {
            history: ['m/set', offset, bytes]
        }
    }

    _getstore(key) {
        this.emit("pc", this.pcounter, "Get from store (key)", key, this.store[key]);
        return {
            history: ['st/get', key],
            value: this.store[key] || WORD(0)
        }
    }

    _setstore(key, val) {
        this.emit("pc", this.pcounter, "Set store (key)", key, val);
        this.store[key] = val;
        return {
            history: ['st/set', key, val]
        }
    }
    setPC(pc) {
        this.emit("pc", this.pcounter, "Set new pc", pc);
        this.pcounter = pc;
        return {
            history: ['goto', pc]
        }
    }
    getPC() {
        return this.pcounter;
    }
    getMemorySize() {
        return this.memory.length;
    }
    getAvailableGas() {
        return this.gas;
    }
    getUsedGas() {
        return this.usedGas;
    }


}

state.commands = {
    '_push': function (state, length, data) {
        let localhistory = [];
        let h3 = state._set(data);
        localhistory.push(h3.history);
        return {
            history: localhistory,
            gas: 3
        }
    },
    '_dup': function (state, length) {
        let localhistory = [];
        let val = state._getN(length);

        localhistory.push(val.history);

        let x = state._set(val.value);
        localhistory.push(x.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    '_swap': function (state, num) {
        let localhistory = [];

        let h3 = state._swap(num);
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'stop': function (state) {

        this.lastrevert = {
            revert: false,
            buffer: Buffer.from(''),
            pc: this.pcounter
        };

        return {
            history: [
                ['terminate']
            ],
            gas: 0,
            stop: true
        }
    },
    'add': function (state) {
        let localhistory = [];

        let h2 = state._get();
        localhistory.push(h2.history);

        let h1 = state._get();
        localhistory.push(h1.history);
        let value = WORDBN(h1.value).iadd(WORDBN(h2.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'mul': function (state) {
        let localhistory = [];

        let h2 = state._get();
        localhistory.push(h2.history);

        let h1 = state._get();
        localhistory.push(h1.history);

        let value = WORDBN(h1.value).imul(WORDBN(h2.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 5
        }
    },
    'sub': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);

        let value = WORDBN(h1.value).isub(WORDBN(h2.value));

        let h3 = state._set((value));

        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'div': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);

        let value = WORDBN(h1.value).div(WORDBN(h2.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 5
        }
    },
    'sdiv': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);


        let value = WORDBN(h1.value).idiv(WORDBN(h2.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 5
        }
    },
    'mod': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);

        let value = WORDBN(h1.value).umod(WORDBN(h2.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 5
        }
    },
    'smod': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);

        let value = WORDBN(h1.value).imod(h2.value);

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 5
        }
    },
    'addmod': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);

        let N = state._get();
        localhistory.push(N.history);

        let value = WORDBN(h1.value).iadd(WORDBN(h2.value)).iumod(WORDBN(N.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 8
        }
    },
    'mulmod': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);

        let N = state._get();
        localhistory.push(N.history);

        let value = WORDBN(h1.value).imul(WORDBN(h2.value)).iumod(WORDBN(N.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 8
        }
    },
    'exp': function (state) {
        let localhistory = [];

        let h1 = state._get();
        localhistory.push(h1.history);

        let h2 = state._get();
        localhistory.push(h2.history);


        let value = WORDBN(h1.value).pow(WORDBN(h2.value));

        let h3 = state._set((value));
        localhistory.push(h3.history);

        return {
            history: localhistory,
            gas: 10
        }
    },
    'signextend': function (state) {
        let localhistory = [];

        let x = state._get();
        localhistory.push(x.history);

        let b = state._get();
        localhistory.push(b.history);

        let value = 0;
        throw new Error('not implemented');

        let y = state._set(value);
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 5
        }
    },
    'lt': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let b = state._get();
        localhistory.push(b.history);
        let value = WORDBN(a.value).lt(WORDBN(b.value)) ? 1 : 0;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'gt': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let b = state._get();
        localhistory.push(b.history);

        let value = WORDBN(a.value).gt(WORDBN(b.value)) ? 1 : 0;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'slt': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let b = state._get();
        localhistory.push(b.history);

        let value = WORDBN(a.value).lt(WORDBN(b.value)) ? 1 : 0;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'sgt': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let b = state._get();
        localhistory.push(b.history);

        let value = WORDBN(a.value).gt(WORDBN(b.value)) ? 1 : 0;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'eq': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let b = state._get();
        localhistory.push(b.history);

        let value = WORDBN(a.value).eq(WORDBN(b.value)) ? 1 : 0;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'iszero': function (state) {
        let localhistory = [];

        let x = state._get();
        localhistory.push(x.history);

        let value = WORDBN(x.value).isZero() ? 1 : 0;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'and': function (state) {
        let localhistory = [];

        let b = state._get();
        localhistory.push(b.history);

        let a = state._get();
        localhistory.push(a.history);

        let value = WORDBN(a.value).iand(WORDBN(b.value));

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'or': function (state) {
        let localhistory = [];

        let b = state._get();
        localhistory.push(b.history);

        let a = state._get();
        localhistory.push(a.history);

        let value = WORDBN(a.value).ior(WORDBN(b.value));;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'xor': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let b = state._get();
        localhistory.push(b.history);

        let value = WORDBN(a.value).ixor(WORDBN(b.value));;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'not': function (state) {
        let localhistory = [];

        let a = state._get();
        localhistory.push(a.history);

        let value = WORDBN(a.value).inotn(256);

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'byte': function (state) {
        let localhistory = [];

        let i = state._get();
        localhistory.push(a.history);

        let x = state._get();
        localhistory.push(b.history);

        let value = WORDBN(x.value).iushr(WORDBN(i.value).iumul(WORDBN(8).iusub(WORDBN(248)))).iand(WORDBN(0xFF));
        //let value = (x.value >> (248 - i.value * 8)) & 0xFF;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'shl': function (state) {
        let localhistory = [];

        let shift = state._get();
        localhistory.push(shift.history);

        let val = state._get();
        localhistory.push(val.history);

        let value = WORDBN(val.value).iushln(WORDBN(shift.value).toNumber());

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'shr': function (state) {
        let localhistory = [];

        let shift = state._get();
        localhistory.push(shift.history);

        let val = state._get();
        localhistory.push(val.history);

        let value = WORDBN(val.value).iushrn(WORDBN(shift.value).toNumber());

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'sar': function (state) {
        let localhistory = [];

        let shift = state._get();
        localhistory.push(shift.history);

        let val = state._get();
        localhistory.push(val.history);

        let value = WORDBN(val.value).ishr(WORDBN(shift.value));

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'sha3': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let buff = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(buff.history);
        const hash = createKeccakHash('keccak256').update(buff.value).digest('hex')

        value = hash;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'address': function (state) {

        let y = state._set((state.getAddress()));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'balance': function (state) {
        let localhistory = [];

        let addr = state._get();
        localhistory.push(a.history);

        let value = state.getBalance(a.value);

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 700
        }
    },
    'origin': function (state) {
        let localhistory = [];

        let y = state._set((state.input.origin));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'caller': function (state) {
        let localhistory = [];

        let y = state._set((state.input.caller));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'callvalue': function (state) {
        let localhistory = [];

        let y = state._set((state.input.callvalue));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'calldataload': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let value = Buffer.from(state.input.calldata, 'hex').slice(WORD2NUM(offset.value), WORD2NUM(offset.value) + 32);
        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'calldatasize': function (state) {
        let localhistory = [];

        let y = state._set((state.input.calldatasize));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'calldatacopy': function (state) {
        let localhistory = [];

        let length = state._get();
        localhistory.push(length.history);

        let offset = state._get();
        localhistory.push(offset.history);

        let destOffset = state._get();
        localhistory.push(destOffset.history);
        let buff = state._setmem(WORD2NUM(destOffset.value), state.input.calldata.slice(WORD2NUM(offset.value), WORD2NUM(offset.value) + WORD2NUM(length.value)));

        localhistory.push(buff.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'codesize': function (state) {
        let localhistory = [];

        let y = state._set((state.input.codesize));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'codecopy': function (state) {
        let localhistory = [];

        let destOffset = state._get();
        localhistory.push(destOffset.history);

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let buff = state._setmem(WORD2NUM(destOffset.value), Buffer.from(state.input.code, 'hex').slice(WORD2NUM(offset.value), WORD2NUM(offset.value) + WORD2NUM(length.value)));

        localhistory.push(buff.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'gasprice': function (state) {
        let localhistory = [];

        let y = state._set((state.input.gasprice));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'extcodesize': function (state) {
        let localhistory = [];

        let addr = state._get();
        localhistory.push(addr.history);

        let value = state.getAddressCode(addr.value).length;

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 700
        }
    },
    'extcodecopy': function (state) {
        let localhistory = [];


        let addr = state._get();
        localhistory.push(addr.history);

        let destOffset = state._get();
        localhistory.push(destOffset.history);

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let code = state.getAddressCode(addr.value);
        let buff = state._setmem(WORD2NUM(destOffset.value), code.slice(WORD2NUM(offset.value), WORD2NUM(offset.value) + WORD2NUM(length.value)));
        localhistory.push(buff.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'returndatasize': function (state) {
        let localhistory = [];

        let y = state._set((state.input.returndatasize));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'returndatacopy': function (state) {
        return state.commands.codecopy(state, state.input.returndata);
    },
    'extcodehash': function (state) {
        let localhistory = [];

        let addr = state._get();
        localhistory.push(addr.history);

        const hash = new Keccak(256);
        let code = state.getAddressCode(addr.value);

        hash.update(code ? addr.value : 0);
        value = hash.digest('hex');

        let y = state._set((value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 700
        }
    },
    'blockhash': function (state) {
        let localhistory = [];

        let blockNum = state._get();
        localhistory.push(blockNum.history);

        let y = state._set((state.getBlockHash(blockNum.value)));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 20
        }
    },
    'coinbase': function (state) {
        let localhistory = [];

        let y = state._set((state.input.block_coinbase));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'timestamp': function (state) {
        let localhistory = [];

        let y = state._set((state.input.block_timestamp));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'number': function (state) {
        let localhistory = [];

        let y = state._set((state.input.block_number));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'difficulty': function (state) {
        let localhistory = [];

        let y = state._set((state.input.block_difficulty));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'gaslimit': function (state) {
        let localhistory = [];

        let y = state._set((state.input.gaslimit));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'pop': function (state) {
        let localhistory = [];

        let _ = state._get();
        localhistory.push(_.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'mload': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let val = state._getmem(WORD2NUM(offset.value), 32);
        localhistory.push(val.history);

        let y = state._set((val.value));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'mstore': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let val = state._get();
        localhistory.push(val.history);

        let y = state._setmem(WORD2NUM(offset.value), Buffer.from(val.value, 'hex'));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'mstore8': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let val = state._get();
        localhistory.push(val.history);

        let y = state._setmem(WORD2NUM(offset.value), Buffer.from(val.value, 'hex'));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 3
        }
    },
    'sload': function (state) {
        let localhistory = [];

        let key = state._get();
        localhistory.push(key.history);

        let y = state._getstore(key.value);
        localhistory.push(y.history);
        let z = state._set((y.value));
        localhistory.push(z.history);

        return {
            history: localhistory,
            gas: 800
        }
    },
    'sstore': function (state) {
        let localhistory = [];

        let key = state._get();
        localhistory.push(key.history);

        let val = state._get();
        localhistory.push(val.history);

        let y = state._setstore(key.value, val.value);
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 20000
        }
    },
    'jump': function (state) {
        //todo jump to opcode number, not byte number!
        let localhistory = [];

        let goto = state._get();
        localhistory.push(goto.history);

        let num = new BN(goto.value, 'hex').toNumber();
        let x = state.setPC(num);
        localhistory.push(x.history);

        return {
            history: localhistory,
            gas: 8,
            offset: -1
        }
    },
    'jumpi': function (state) {
        //todo jump to opcode number, not byte number!
        let localhistory = [];
        let ret = {
            history: localhistory,
            gas: 10
        };
        let goto = state._get();
        localhistory.push(goto.history);

        let condition = state._get();
        localhistory.push(condition.history);

        let cond = new BN(condition.value, 'hex').gt(new BN(0));

        if (cond) {
            let num = new BN(goto.value, 'hex').toNumber();
            let x = state.setPC(num);
            localhistory.push(x.history);
            ret.offset = -1;
        }

        return ret
    },
    'pc': function (state) {
        let localhistory = [];

        let y = state._set((state.getPC()));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'msize': function (state) {
        let localhistory = [];

        let y = state._set((state.getMemorySize()));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'gas': function (state) {
        let localhistory = [];

        let y = state._set((state.getAvailableGas()));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 2
        }
    },
    'jumpdest': function (state) {
        return {
            history: [
                ['jumpdest']
            ],
            gas: 1
        }
    },
    'log0': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(mem.history);

        localhistory.push(['log0', mem.value]);

        return {
            history: localhistory,
            gas: 375
        }
    },
    'log1': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let topic1 = state._get();
        localhistory.push(topic1.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(mem.history);

        localhistory.push(['log1', mem.value, topic1.value]);

        return {
            history: localhistory,
            gas: 750
        }
    },
    'log2': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let topic1 = state._get();
        localhistory.push(topic1.history);

        let topic2 = state._get();
        localhistory.push(topic2.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(mem.history);

        localhistory.push(['log2', mem.value, topic1.value, topic2.value]);

        return {
            history: localhistory,
            gas: 1125
        }
    },
    'log3': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let topic1 = state._get();
        localhistory.push(topic1.history);

        let topic2 = state._get();
        localhistory.push(topic2.history);

        let topic3 = state._get();
        localhistory.push(topic3.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(mem.history);

        localhistory.push(['log3', mem.value, topic1.value, topic2.value, topic3.value]);

        return {
            history: localhistory,
            gas: 1500
        }
    },
    'log4': function (state) {
        let localhistory = [];

        let topic4 = state._get();
        localhistory.push(topic4.history);

        let topic3 = state._get();
        localhistory.push(topic3.history);

        let topic2 = state._get();
        localhistory.push(topic2.history);

        let topic1 = state._get();
        localhistory.push(topic1.history);

        let length = state._get();
        localhistory.push(length.history);

        let offset = state._get();
        localhistory.push(offset.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(mem.history);

        localhistory.push(['log4', mem.value, topic1.value, topic2.value, topic3.value, topic4.value]);

        return {
            history: localhistory,
            gas: 1875
        }
    },
    'revert': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        localhistory.push(mem.history);

        state.lastrevert = {
            revert: true,
            buffer: Buffer.from(mem.value),
            pc: this.pcounter
        };

        return {
            history: localhistory,
            gas: 0,
            stop: true
        }
    },
    'selfdestruct': function (state) {

        //null state
        //send balance to address

        return {
            history: [],
            gas: 0,
            stop: true
        }
    },
    ///?
    'create': function (state) {
        let localhistory = [];

        let wei = state._get();
        localhistory.push(wei.history);

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let newAddress = state.getAddress();
        let nonce = state.getNonce();

        let addr = ethereumjs.bufferToHex(ethereumjs.generateAddress(Buffer.from(newAddress.value, 'hex'), Buffer.from(ethereumjs.intToHex(nonce), 'hex')));
        let code = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));

        //TODO:
        //send tx with gas: wei, and code
        //add send to history

        let y = state._set((addr));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 32000
        }
    },
    'call': function (state) {
        let localhistory = [];



        let gas = state._get();
        localhistory.push(gas.history);

        let addr = state._get();
        localhistory.push(addr.history);

        let wei = state._get();
        localhistory.push(wei.history);

        let argsOffset = state._get();
        localhistory.push(argsOffset.history);

        let argsLength = state._get();
        localhistory.push(argsLength.history);

        let retOffset = state._get();
        localhistory.push(retOffset.history);

        let retLength = state._get();
        localhistory.push(retLength.history);

        //get gas 
        //get params from memory
        ////memory[argsOffset:argsOffset+argsLength]
        //get code by address
        //load state of code
        //set memory[retOffset:retOffset+retLength] result of execution

        let success = 1 || 0;

        let res = state._set((success));
        localhistory.push(res.history);

        return {
            history: localhistory,
            gas: gas.value
        }
    },
    'callcode': function (state) {
        let localhistory = [];

        let gas = state._get();
        localhistory.push(gas.history);

        let addr = state._get();
        localhistory.push(addr.history);

        let code = state._get();
        localhistory.push(code.history);

        let argsOffset = state._get();
        localhistory.push(argsOffset.history);

        let argsLength = state._get();
        localhistory.push(argsLength.history);

        let retOffset = state._get();
        localhistory.push(retOffset.history);

        let retLength = state._get();
        localhistory.push(retLength.history);

        //TODO:
        //get gas 
        //get args from memory
        ////memory[argsOffset:argsOffset+argsLength]
        //copy current state
        //execute code in currenct state
        //set memory[retOffset:retOffset+retLength] result of execution

        let success = 1 || 0;

        let res = state._set((success));
        localhistory.push(res.history);

        return {
            success: success,
            history: localhistory,
            gas: gas.value
        }
    },
    'return': function (state) {
        let localhistory = [];

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let mem = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));

        localhistory.push(mem.history);
        //TODO: how to return mem.value?

        state.lastreturn = {
            return: true,
            buffer: mem.value,
            pc: this.pcounter,
            tag: state.currentTag
        }

        let data = {
            return: true,
            returnTag: state.currentTag,
            value: mem.value,
            history: localhistory,
            gas: 0
        };

        if (state.currentTag == 'init')
            data.offset = -2000;

        return data;
    },
    'delegatecall': function (state) {
        let localhistory = [];

        let gas = state._get();
        localhistory.push(gas.history);

        let addr = state._get();
        localhistory.push(addr.history);

        let argsOffset = state._get();
        localhistory.push(argsOffset.history);

        let argsLength = state._get();
        localhistory.push(argsLength.history);

        let retOffset = state._get();
        localhistory.push(retOffset.history);

        let retLength = state._get();
        localhistory.push(retLength.history);

        //TODO:
        //get gas 
        //get args from memory
        ////memory[argsOffset:argsOffset+argsLength]
        //copy state of contract {address}
        //execute code
        //set memory[retOffset:retOffset+retLength] result of execution

        let success = 1 || 0;

        let res = state._set((success));
        localhistory.push(res.history);

        return {
            success: success,
            history: localhistory,
            gas: gas.value
        }
    },
    'create2': function (state) {
        let localhistory = [];

        let wei = state._get();
        localhistory.push(wei.history);

        let offset = state._get();
        localhistory.push(offset.history);

        let length = state._get();
        localhistory.push(length.history);

        let salt = state._get();
        localhistory.push(salt.history);

        let creatorAddress = state.getAddress();
        let code = state._getmem(WORD2NUM(offset.value), WORD2NUM(length.value));
        let addr = ethereumjs.bufferToHex(ethereumjs.generateAddress2(creatorAddress.value, salt.value, code.value));

        //TODO:
        //send tx with gas: wei, and code
        //add send to history

        let y = state._set((addr));
        localhistory.push(y.history);

        return {
            history: localhistory,
            gas: 32000
        }
    },
    'staticcall': function (state) {
        let localhistory = [];

        let gas = state._get();
        localhistory.push(gas.history);

        let addr = state._get();
        localhistory.push(addr.history);

        let argsOffset = state._get();
        localhistory.push(argsOffset.history);

        let argsLength = state._get();
        localhistory.push(argsLength.history);

        let retOffset = state._get();
        localhistory.push(retOffset.history);

        let retLength = state._get();
        localhistory.push(retLength.history);

        //TODO:
        //get gas 
        //get args from memory
        ////memory[argsOffset:argsOffset+argsLength]
        //copy state of contract {address}
        //execute code
        //set memory[retOffset:retOffset+retLength] result of execution

        let success = 1 || 0;

        let res = state._set((success));
        localhistory.push(res.history);

        return {
            success: success,
            history: localhistory,
            gas: gas.value
        }
    },
}

module.exports = state;