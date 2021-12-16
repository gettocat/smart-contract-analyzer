const Reader = require('./reader');
const State = require('./state');
const { WORD, WORDMETHOD } = require('./word');

class SmartContract {

    constructor(code, owner_address, owner_nonce) {
        this.initialcode = code;
        this.binary = false;
        this.state = null;
    }
    createContractAddress() {
        return "0x00000010000200003000040000500006"
    }
    deploy(constructorParams, options) {

        if (!options)
            options = {};

        options.codesize = 0;//this.initialcode.length;
        options.code = this.initialcode;

        let payload = "";
        for (let i in constructorParams) {
            payload += WORD(constructorParams[i]);
        }

        payload = Buffer.from(payload, 'hex');
        options.calldata = payload;
        options.calldatasize = payload.length;
        options.code = Buffer.concat([options.code, payload])

        let deploy = new Deployer(this, options);
        let res = deploy.getResult();
        this.binary = res.binary;
        this.state = res.state;
    }
    call(method, params, options) {
        if (!options)
            options = {};

        options.codesize = this.binary.length;
        options.code = this.binary;

        let payload = WORDMETHOD(method);
        for (let i in params) {
            payload += WORD(params[i]);
        }

        let call = new Call(this, payload, options);
        return call.getResult();//state.getLastReturnInfo().buffer;
    }
    callStatic(method, params, options) {

        if (!options)
            options = {};

        let payload = WORDMETHOD(method);
        for (let i in params) {
            payload += WORD(params[i]);
        }

        let call = new Call(this, payload, options);
        return call.getResult()//.state.getLastReturnInfo().buffer;
    }

}

class Deployer {

    constructor(smartcontract, options) {
        this.smartcontract = smartcontract;
        this.code = this.smartcontract.initialcode;
        this.state = new State(this.code);
        this.setOptions(options);
        this.inited = false;
        this.result = false;

        this.callConstructor();

    }
    setOptions(options) {
        this.state.updateOptions(options);
    }
    init() {
        if (this.inited)
            return false;

        let e = new Executor(this.code, this.state);
        this.state = e.getState();
        return e.getResult();

    }
    callConstructor() {
        let res = this.init();

        if (res[0] && res[1] == 'init') {
            this.result = res[2];
        }

        if (!res[0] && res[1] == 'revert') {
            throw new Error('revert catched at line ' + res[3] + ": " + res[2]);
        }
    }
    getResult() {
        return { binary: this.result, state: this.state };
    }

}

class Call {
    constructor(smartcontract, payload, options) {
        this.smartcontract = smartcontract;
        this.payload = payload;

        if (!this.smartcontract.binary) {
            throw new Error('Smart contract is not inited, please use .deploy() first');
        }

        if (!options)
            options = {};

        options.codesize = smartcontract.binary.length;
        options.calldata = Buffer.from(payload, 'hex');
        options.calldatasize = WORD(Buffer.from(payload, 'hex').length);
        this.execute(options);
    }
    setOptions(options) {
        this.smartcontract.state.updateOptions(options);
    }
    execute(options) {
        let res = this.init(options)

        if (res[0] && res[1] == 'init') {
            this.result = res[2];
        }

        if (!res[0] && res[1] == 'revert') {
            throw new Error('revert catched at line ' + res[3] + ": " + res[2]);
        }
    }
    init(options) {
        let code = this.smartcontract.binary;
        this.state = new State(code, this.smartcontract.state.export());
        this.state.updateOptions(options)

        let e = new Executor(code, this.state);
        this.state = e.getState();
        return e.getResult();
    }
    getResult() {
        return { state: this.state, return: this.result }
    }
}

class Executor {

    constructor(code, state) {
        this.state = state;
        this.code = code;
        this.result = null;

        let rn = new Reader(this.code, this.state);
        while (this.state.pcounter < this.code.length) {

            let type = rn.getType(this.code[this.state.pcounter]);
            if (!type) {
                console.log('invalid command ' + type, 'byte', this.code[this.state.pcounter], 'at bytecode length ' + this.state.pcounter);
                this.state.pcounter++;
                continue;
            }

            let comm = Reader.commands[type];

            if (!comm) {
                comm = '_undefined_' + type;
                this.state.pcounter++;
                continue;
            }

            //this.emit("newpc", this.pc); 
            let res = rn.read(comm, this.state.pcounter);
            //console.log(this.state.pcounter, comm, '->', res.offset);
            if (res.offset > 0)//jump,jumpi returns -1
                this.state.pcounter = res.offset;

            if (res.return) {
                if (res.returnInfo.tag == 'init') {
                    this.result = [true, 'init', res.returnInfo.buffer];
                    break;
                }
            }

            if (res.stop) {
                if (res.revertInfo.revert) {
                    //console.log('REVERT catched at pc ', res.revertInfo.pc, 'message: ', res.revertInfo.buffer);
                    this.result = [false, 'revert', res.revertInfo.buffer, res.revertInfo.pc];
                    break;
                } else {
                    //console.log('STOP catched at pc ', res.revertInfo.pc);
                    this.result = [true, 'stop'];
                    break;
                }
            }

        }
    }
    getResult() {
        return this.result;
    }
    getState() {
        return this.state;
    }

}


module.exports = {

    SmartContract,
    Call,
    Deployer

}