let BN = require('ethereumjs-util').BN;
function WORD(data) {
    return new _WORD(data).toBuffer().toString('hex');//maybe buffer better
}

function WORDBN(data) {
    return new _WORD(data).toBN();
}

function WORD2NUM(data){
    return WORDBN(data).toNumber();
}

function WORDMETHOD(methodHash){
    //return WORDBN(methodHash).iushln(224).toBuffer('be', 32).toString('hex');
    return WORDBN(methodHash).toBuffer('be', 4).toString('hex');
}

class _WORD {
    constructor(data, inputEncoding) {
        this.data = null;
        try {
            if (data instanceof BN)
                this.data = this.fromBN(data, inputEncoding);

            if (data instanceof Buffer)
                this.data = this.fromBuff(data, inputEncoding);

            if (typeof data == 'number')
                this.data = this.fromNum(data, inputEncoding);

            if (typeof data == 'string')
                this.data = this.fromStr(data, inputEncoding);

            if (!this.data)
                this.data = this.fromBuff(data, inputEncoding);
        } catch (e) {
            this.error(e);
        }
    }
    fromBuff(d, inputEncoding) {
        let buffer = Buffer.from(d, inputEncoding || 'hex');
        return this.fromNum(buffer)
    }
    fromStr(str, inputEncoding) {
        let d = str.split("0x").join("");
        let buffer = Buffer.from(d, 'hex');
        return this.fromNum(buffer)
    }
    fromNum(d, inputEncoding) {
        let a = new BN(d, inputEncoding || 10);
        this.bn = a;
        return this.bn.toBuffer('be', 32);
    }
    fromBN(data, inputEncoding) {
        this.bn = data;
        return this.bn.toBuffer('be', 32);
    }
    //
    error(e) {
        console.log(e);
    }
    toBuffer() {
        return this.data;
    }
    toBN() {
        return this.bn;
    }
}


module.exports = {
    BN,
    WORD,
    WORDBN,
    WORD2NUM:WORD2NUM,
    WORDMETHOD:WORDMETHOD,
    wordClass: _WORD
};