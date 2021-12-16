
class reader {

    constructor(code, state) {
        this.state = state;
        this.code = code;
    }
    getType(byte) {
        let t = parseInt(byte).toString(16);
        if (t.length < 2)
            t = "0" + t;
        return '0x' + t;
    }
    //
    read(name, offset) {
        let count = this.code[offset];

        if (/^push(\d+)$/i.test(name)) {
            return this[name].apply(this, [offset])
        }

        offset = this.state.exec(offset, name);
        let revertInfo = this.state.getLastRevertInfo();
        let returnInfo = this.state.getLastReturnInfo();

        return {
            stop: offset == -1000,
            return: offset == -2000,
            returnInfo: returnInfo,
            revertInfo: revertInfo,
            offset: offset,
            result: count,
            raw: this.code[offset]
        }
    }
    push1(offset) {
        let count = this.code[offset];
        let data = this.code[offset + 1];

        this.state.exec(offset, 'push1', data);

        return {
            offset: offset + 2,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push2(offset) {
        let size = 2;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push3(offset) {
        let size = 3;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push4(offset) {
        let size = 4;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push5(offset) {
        let size = 5;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push6(offset) {
        let size = 6;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push7(offset) {
        let size = 7;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push8(offset) {
        let size = 8;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push9(offset) {
        let size = 9;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push10(offset) {
        let size = 10;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push11(offset) {
        let size = 11;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push12(offset) {
        let size = 12;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push13(offset) {
        let size = 13;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push14(offset) {
        let size = 14;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push15(offset) {
        let size = 15;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push16(offset) {
        let size = 16;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push17(offset) {
        let size = 17;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push18(offset) {
        let size = 18;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push19(offset) {
        let size = 19;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push20(offset) {
        let size = 20;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push21(offset) {
        let size = 21;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push22(offset) {
        let size = 22;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push23(offset) {
        let size = 23;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push24(offset) {
        let size = 24;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push25(offset) {
        let size = 25;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push26(offset) {
        let size = 26;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push27(offset) {
        let size = 27;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push28(offset) {
        let size = 28;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push29(offset) {
        let size = 29;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push30(offset) {
        let size = 30;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push31(offset) {
        let size = 31;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }
    push32(offset) {
        let size = 32;
        let count = this.code[offset];
        let data = this.code.subarray(offset + 1, offset + 1 + size);
        this.state.exec(offset, 'push' + size, data);

        return {
            offset: offset + 1 + size,
            result: count,
            raw: this.code[offset],
            data: data
        }
    }


}

reader.commands = {
    "0x00": "stop",
    "0x01": "add",
    "0x02": "mul",
    "0x03": "sub",
    "0x04": "div",
    "0x05": "sdiv",
    "0x06": "mod",
    "0x07": "smod",
    "0x08": "addmod",
    "0x09": "mulmod",
    "0x0a": "exp",
    "0x0b": "signextend",
    "0x10": "lt",
    "0x11": "gt",
    "0x12": "slt",
    "0x13": "sgt",
    "0x14": "eq",
    "0x15": "iszero",
    "0x16": "and",
    "0x17": "or",
    "0x18": "xor",
    "0x19": "not",
    "0x1a": "byte",
    "0x1b": "shl",
    "0x1c": "shr",
    "0x1d": "sar",
    "0x20": "sha3",
    "0x30": "address",
    "0x31": "balance",
    "0x32": "origin",
    "0x33": "caller",
    "0x34": "callvalue",
    "0x35": "calldataload",
    "0x36": "calldatasize",
    "0x37": "calldatacopy",
    "0x38": "codesize",
    "0x39": "codecopy",
    "0x3a": "gasprice",
    "0x3b": "extcodesize",
    "0x3c": "extcodecopy",
    "0x3d": "returndatasize",
    "0x3e": "returndatacopy",
    "0x3f": "extcodehash",
    "0x40": "blockhash",
    "0x41": "coinbase",
    "0x42": "timestamp",
    "0x43": "number",
    "0x44": "difficulty",
    "0x45": "gaslimit",
    "0x50": "pop",
    "0x51": "mload",
    "0x52": "mstore",
    "0x53": "mstore8",
    "0x54": "sload",
    "0x55": "sstore",
    "0x56": "jump",
    "0x57": "jumpi",
    "0x58": "pc",
    "0x59": "msize",
    "0x5a": "gas",
    "0x5b": "jumpdest",
    "0x60": "push1",
    "0x61": "push2",
    "0x62": "push3",
    "0x63": "push4",
    "0x64": "push5",
    "0x65": "push6",
    "0x66": "push7",
    "0x67": "push8",
    "0x68": "push9",
    "0x69": "push10",
    "0x6a": "push11",
    "0x6b": "push12",
    "0x6c": "push13",
    "0x6d": "push14",
    "0x6e": "push15",
    "0x6f": "push16",
    "0x70": "push17",
    "0x71": "push18",
    "0x72": "push19",
    "0x73": "push20",
    "0x74": "push21",
    "0x75": "push22",
    "0x76": "push23",
    "0x77": "push24",
    "0x78": "push25",
    "0x79": "push26",
    "0x7a": "push27",
    "0x7b": "push28",
    "0x7c": "push29",
    "0x7d": "push30",
    "0x7e": "push31",
    "0x7f": "push32",
    "0x80": "dup1",
    "0x81": "dup2",
    "0x82": "dup3",
    "0x83": "dup4",
    "0x84": "dup5",
    "0x85": "dup6",
    "0x86": "dup7",
    "0x87": "dup8",
    "0x88": "dup9",
    "0x89": "dup10",
    "0x8a": "dup11",
    "0x8b": "dup12",
    "0x8c": "dup13",
    "0x8d": "dup14",
    "0x8e": "dup15",
    "0x8f": "dup16",
    "0x90": "swap1",
    "0x91": "swap2",
    "0x92": "swap3",
    "0x93": "swap4",
    "0x94": "swap5",
    "0x95": "swap6",
    "0x96": "swap7",
    "0x97": "swap8",
    "0x98": "swap9",
    "0x99": "swap10",
    "0x9a": "swap11",
    "0x9b": "swap12",
    "0x9c": "swap13",
    "0x9d": "swap14",
    "0x9e": "swap15",
    "0x9f": "swap16",
    "0xa0": "log0",
    "0xa1": "log1",
    "0xa2": "log2",
    "0xa3": "log3",
    "0xa4": "log4",
    "0xb0": "push",
    "0xb1": "dup",
    "0xb2": "swap",
    "0xf0": "create",
    "0xf1": "call",
    "0xf2": "callcode",
    "0xf3": "return",
    "0xf4": "delegatecall",
    "0xf5": "create2",
    "0xfa": "staticcall",
    "0xfd": "revert",
    "0xff": "selfdestruct"
};

module.exports = reader