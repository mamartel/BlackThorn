/*!
MIT License

Copyright (c) 2016 Yahiko
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
namespace Blackthorn {
    export const enum Status { FAILURE, SUCCESS, RUNNING, ERROR };

    export class Agent {
        tree: BehaviorTree;
        blackboard: Blackboard;
        ticker: Ticker;

        constructor(subject: any, tree: BehaviorTree, blackboard: Blackboard) {
            this.tree = tree;
            this.blackboard = blackboard;
            this.ticker = new Ticker(subject, blackboard, tree);
        } // constructor

        tick() {
            /* TICK NODE */
            this.tree.root._execute(this.ticker);

            /* CLOSE NODES FROM LAST TICK, IF NEEDED */
            let lastOpenNodes = this.blackboard.get("openNodes", this.tree.id) as BaseNode[];
            let currOpenNodes = this.ticker.openNodes.slice(0);

            // does not close if it is still open in this tick
            let start = 0;
            for (let i = 0; i < Math.min(lastOpenNodes.length, currOpenNodes.length); i++) {
                start = i + 1;
                if (lastOpenNodes[i] !== currOpenNodes[i]) {
                    break;
                }
            }

            // close the nodes
            for (let i = lastOpenNodes.length - 1; i >= start; i--) {
                lastOpenNodes[i]._close(this.ticker);
            }

            /* POPULATE BLACKBOARD */
            this.blackboard.set("openNodes", currOpenNodes, this.tree.id);
            this.blackboard.set("nodeCount", this.ticker.nodeCount, this.tree.id);
        } // tick
    } // Agent

    export class DedicatedAgent extends Agent {
        constructor(subject: any, tree: BehaviorTree) {
            super(subject, tree, new Blackboard());
        }
    } // DedicatedAgent

    export class Blackboard {
        private _baseMemory: any;
        private _treeMemory: any;

        constructor() {
            this._baseMemory = {}; // used to store global information
            this._treeMemory = {}; // used to store tree and node information
        } // constructor

        private _getTreeMemory(treeScope: string) {
            if (!this._treeMemory[treeScope]) {
                this._treeMemory[treeScope] = {
                    "nodeMemory": {},
                    "openNodes": [],
                };
            }

            return this._treeMemory[treeScope];
        } // _getTreeMemory

        private _getNodeMemory(treeMemory: any, nodeScope: string) {
            let memory = treeMemory["nodeMemory"];
            if (!memory[nodeScope]) {
                memory[nodeScope] = {};
            }

            return memory[nodeScope];
        } // _getNodeMemory

        private _getMemory(treeScope?: string, nodeScope?: string) {
            let memory = this._baseMemory;

            if (treeScope) {
                memory = this._getTreeMemory(treeScope);

                if (nodeScope) {
                    memory = this._getNodeMemory(memory, nodeScope);
                }
            }

            return memory;
        } // _getMemory

        set(key: string, value: any, treeScope?: string, nodeScope?: string) {
            let memory = this._getMemory(treeScope, nodeScope);
            memory[key] = value;
        } // set

        get(key: string, treeScope?: string, nodeScope?: string): any {
            let memory = this._getMemory(treeScope, nodeScope);
            return memory[key];
        } // get
    } // Heap

    export class Ticker {
        tree: BehaviorTree;
        openNodes: BaseNode[];
        nodeCount: number;
        debug: any;
        subject: any;
        blackboard: Blackboard;

        constructor(subject: any, blackboard: Blackboard, tree: BehaviorTree) {
            this.tree = tree;
            this.openNodes = [];
            this.nodeCount = 0;
            this.debug = null;
            this.subject = subject;
            this.blackboard = blackboard;
        } // constructor

        enterNode(node: BaseNode) {
            this.nodeCount++;
            this.openNodes.push(node);
            // call debug here
        } // enterNode

        openNode(node: BaseNode) {
            // call debug here
        } // openNode

        tickNode(node: BaseNode) {
            // call debug here
        } // tickNode

        closeNode(node: BaseNode) {
            // call debug here
            this.openNodes.pop();
        } // closeNode

        exitNode(node: BaseNode) {
            // call debug here
        } // exitNode
    } // Ticker

    export class BehaviorTree {
        id: string;
        root: BaseNode;

        constructor(root: BaseNode) {
            this.id = createUUID();
            this.root = root;
        } // constructor

        tick(subject: any, blackboard: Blackboard): void {
            /* CREATE A TICK OBJECT */
            let ticker = new Ticker(subject, blackboard, this);

            /* TICK NODE */
            this.root._execute(ticker);

            /* CLOSE NODES FROM LAST TICK, IF NEEDED */
            let lastOpenNodes = blackboard.get("openNodes", this.id) as BaseNode[];
            let currOpenNodes = ticker.openNodes.slice(0);

            // does not close if it is still open in this tick
            let start = 0;
            for (let i = 0; i < Math.min(lastOpenNodes.length, currOpenNodes.length); i++) {
                start = i + 1;
                if (lastOpenNodes[i] !== currOpenNodes[i]) {
                    break;
                }
            }

            // close the nodes
            for (let i = lastOpenNodes.length - 1; i >= start; i--) {
                lastOpenNodes[i]._close(ticker);
            }

            /* POPULATE BLACKBOARD */
            blackboard.set("openNodes", currOpenNodes, this.id);
            blackboard.set("nodeCount", ticker.nodeCount, this.id);
        } // tick
    } // BehaviorTree

    export abstract class BaseNode {
        id: string;
        children: BaseNode[];

        constructor(children?: BaseNode[]) {
            this.id = createUUID();

            this.children = [];
            if (children) {
                for (let i = 0; i < children.length; i++) {
                    this.children.push(children[i]);
                }
            }
        } // constructor

        _execute(ticker: Ticker): Status {
            /* ENTER */
            this._enter(ticker);

            /* OPEN */
            if (!ticker.blackboard.get("isOpen", ticker.tree.id, this.id)) {
                this._open(ticker);
            }

            /* TICK */
            let status = this._tick(ticker);

            /* CLOSE */
            if (status !== Status.RUNNING) {
                this._close(ticker);
            }

            /* EXIT */
            this._exit(ticker);

            return status;
        } // execute

        // Wrapper functions
        _enter(ticker: Ticker): void {
            ticker.enterNode(this);
            this.enter(ticker);
        } // _enter

        _open(ticker: Ticker): void {
            ticker.openNode(this);
            ticker.blackboard.set("isOpen", true, ticker.tree.id, this.id);
            this.open(ticker);
        } // _open

        _tick(ticker: Ticker): Status {
            ticker.tickNode(this);
            return this.tick(ticker);
        } // _tick

        _close(ticker: Ticker): void {
            ticker.closeNode(this);
            ticker.blackboard.set("isOpen", false, ticker.tree.id, this.id);
            this.close(ticker);
        } // _close

        _exit(ticker: Ticker): void {
            ticker.exitNode(this);
            this.exit(ticker);
        } // _exit

        // Override these to create nodes
        enter(ticker: Ticker): void { }
        open(ticker: Ticker): void { }
        abstract tick(ticker: Ticker): Status;
        close(ticker: Ticker): void { }
        exit(ticker: Ticker): void { }
    } // BaseNote

    export abstract class Action extends BaseNode {
        constructor() {
            super();
        } // constructor
    } // Action

    export abstract class Composite extends BaseNode {
        constructor(...children: BaseNode[]) {
            super(children);
        } // constructor
    } // Composite

    export abstract class Condition extends BaseNode {
        constructor() {
            super();
        } // constructor
    } // Condition

    export abstract class Decorator extends BaseNode {
        constructor(child: BaseNode) {
            super([child]);
        } // constructor
    } // Decorator

    export class Sequence extends Composite {
        tick(ticker: Ticker): Status {
            for (let i = 0; i < this.children.length; i++) {
                let status = this.children[i]._execute(ticker);

                if (status !== Status.SUCCESS) {
                    return status;
                }
            }

            return Status.SUCCESS;
        } // tick
    } // Sequence

    export class Selector extends Composite {
        tick(ticker: Ticker): Status {
            for (let i = 0; i < this.children.length; i++) {
                let status = this.children[i]._execute(ticker);

                if (status !== Status.FAILURE) {
                    return status;
                }
            }

            return Status.FAILURE;
        } // tick
    } // Selector

    export class MemSequence extends Composite {
        open(ticker: Ticker): void {
            super.open(ticker);
            ticker.blackboard.set("runningChild", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            let childIndex = ticker.blackboard.get("runningChild", ticker.tree.id, this.id) as number;
            for (let i = childIndex; i < this.children.length; i++) {
                let status = this.children[i]._execute(ticker);

                if (status !== Status.SUCCESS) {
                    if (status === Status.RUNNING) {
                        ticker.blackboard.set("runningChild", i, ticker.tree.id, this.id);
                    }
                    return status;
                }
            }

            return Status.SUCCESS;
        } // tick
    } // MemSequence

    export class MemSelector extends Composite {
        open(ticker: Ticker): void {
            super.open(ticker);
            ticker.blackboard.set("runningChild", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            let childIndex = ticker.blackboard.get("runningChild", ticker.tree.id, this.id) as number;
            for (let i = childIndex; i < this.children.length; i++) {
                let status = this.children[i]._execute(ticker);

                if (status !== Status.FAILURE) {
                    if (status === Status.RUNNING) {
                        ticker.blackboard.set("runningChild", i, ticker.tree.id, this.id);
                    }
                    return status;
                }
            }

            return Status.FAILURE;
        } // tick
    } // MemSelector

    export class Inverter extends Decorator {
        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let status = child._execute(ticker);

            if (status === Status.SUCCESS)
                status = Status.FAILURE;
            else if (status === Status.FAILURE)
                status = Status.SUCCESS;

            return status;
        } // tick
    } // Inverter

    export class Limiter extends Decorator {
        maxLoop: number;

        constructor(child: BaseNode, maxLoop = 1) {
            super(child);
            this.maxLoop = maxLoop;
        } // constructor

        open(ticker: Ticker): void {
            super.open(ticker);
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let i = ticker.blackboard.get("i", ticker.tree.id, this.id);

            if (i < this.maxLoop) {
                let status = child._execute(ticker);

                if (status === Blackthorn.Status.SUCCESS || status === Blackthorn.Status.FAILURE) {
                    ticker.blackboard.set("i", i + 1, ticker.tree.id, this.id);
                }
                return status;
            }

            return Status.FAILURE;
        } // tick
    } // Limiter

    export class MaxTime extends Decorator {
        maxTime: number;

        constructor(child: BaseNode, maxTime: number) {
            super(child);
            this.maxTime = maxTime;
        } // constructor

        open(ticker: Ticker): void {
            super.open(ticker);
            let startTime = (new Date()).getTime();
            ticker.blackboard.set("startTime", startTime, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let currTime = (new Date()).getTime();
            let startTime = ticker.blackboard.get("startTime", ticker.tree.id, this.id);

            let status = child._execute(ticker);
            if (currTime - startTime > this.maxTime) {
                child._close(ticker);
                return Status.FAILURE;
            }

            return status;
        } // tick
    } // MaxTime

    export class MaxTicks extends Decorator {
        maxTicks: number;

        constructor(child: BaseNode, maxTicks: number) {
            super(child);
            this.maxTicks = maxTicks;
        } // constructor

        open(ticker: Ticker): void {
            super.open(ticker);
            ticker.blackboard.set("elapsedTicks", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let elapsedTicks = ticker.blackboard.get("elapsedTicks", ticker.tree.id, this.id);

            let status = child._execute(ticker);
            if (elapsedTicks >= this.maxTicks) {
                child._close(ticker);
                return Status.FAILURE;
            }

            ticker.blackboard.set("elapsedTicks", elapsedTicks + 1, ticker.tree.id, this.id);

            return status;
        } // tick
    } // MaxTicks

    export class Repeater extends Decorator {
        maxLoop: number;

        constructor(child: BaseNode, maxLoop = -1) {
            super(child);
            this.maxLoop = maxLoop;
        } // constructor

        open(ticker: Ticker): void {
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let i = ticker.blackboard.get("i", ticker.tree.id, this.id);
            let status = Blackthorn.Status.SUCCESS;

            while (this.maxLoop < 0 || i < this.maxLoop) {
                status = child._execute(ticker);

                if (status === Blackthorn.Status.SUCCESS || status === Blackthorn.Status.FAILURE)
                    i++;
                else
                    break;
            }

            ticker.blackboard.set("i", i, ticker.tree.id, this.id);
            return status;
        } // tick
    } // Repeater

    export class RepeatUntilFailure extends Decorator {
        maxLoop: number;

        constructor(child: BaseNode, maxLoop = -1) {
            super(child);
            this.maxLoop = maxLoop;
        } // constructor

        open(ticker: Ticker): void {
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let i = ticker.blackboard.get("i", ticker.tree.id, this.id);
            let status = Blackthorn.Status.SUCCESS;

            while (this.maxLoop < 0 || i < this.maxLoop) {
                let status = child._execute(ticker);

                if (status === Blackthorn.Status.SUCCESS)
                    i++;
                else
                    break;
            }

            ticker.blackboard.set("i", i, ticker.tree.id, this.id);
            return status;
        } // tick
    } // RepeatUntilFailure

    export class RepeatUntilSuccess extends Decorator {
        maxLoop: number;

        constructor(child: BaseNode, maxLoop = -1) {
            super(child);
            this.maxLoop = maxLoop;
        } // constructor

        open(ticker: Ticker): void {
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            if (this.children.length !== 1) {
                return Status.ERROR;
            }

            let child = this.children[0];
            let i = ticker.blackboard.get("i", ticker.tree.id, this.id);
            let status = Blackthorn.Status.FAILURE;

            while (this.maxLoop < 0 || i < this.maxLoop) {
                let status = child._execute(ticker);

                if (status === Blackthorn.Status.FAILURE)
                    i++;
                else
                    break;
            }

            ticker.blackboard.set("i", i, ticker.tree.id, this.id);
            return status;
        } // tick
    } // RepeatUntilSuccess

    export class Error extends Action {
        tick(ticker: Ticker): Status {
            return Status.ERROR;
        } // tick
    } // Error

    export class Failer extends Action {
        tick(ticker: Ticker): Status {
            return Status.FAILURE;
        } // tick
    } // Failer

    export class Runner extends Action {
        tick(ticker: Ticker): Status {
            return Status.RUNNING;
        } // tick
    } // Runner

    export class Succeeder extends Action {
        tick(ticker: Ticker): Status {
            return Status.SUCCESS;
        } // tick
    } // Succeeder

    export class WaitTime extends Action {
        duration: number; // in ms

        constructor(duration: number = 0) {
            super();
            this.duration = duration;
        } // constructor

        open(ticker: Ticker): void {
            let startTime = (new Date()).getTime();
            ticker.blackboard.set("startTime", startTime, ticker.tree.id, this.id);
        }

        tick(ticker: Ticker): Status {
            let currTime = (new Date()).getTime();
            let startTime = ticker.blackboard.get("startTime", ticker.tree.id, this.id);

            if (currTime - startTime >= this.duration) {
                return Status.SUCCESS;
            }

            return Status.RUNNING;
        }
    } // WaitTime

    export class WaitTicks extends Action {
        duration: number; // in ticks

        constructor(duration: number = 0) {
            super();
            this.duration = duration;
        } // constructor

        open(ticker: Ticker): void {
            ticker.blackboard.set("elapsedTicks", 0, ticker.tree.id, this.id);
        } // open

        tick(ticker: Ticker): Status {
            let elapsedTicks = ticker.blackboard.get("elapsedTicks", ticker.tree.id, this.id);

            if (elapsedTicks >= this.duration) {
                return Status.SUCCESS;
            }

            ticker.blackboard.set("elapsedTicks", elapsedTicks + 1, ticker.tree.id, this.id);

            return Status.RUNNING;
        }
    } // WaitTicks

    function createUUID() {
        let s: string[] = Array(36);
        let hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        // bits 12-15 of the time_hi_and_version field to 0010
        s[14] = "4";

        // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[19] = hexDigits.substr((parseInt(s[19], 16) & 0x3) | 0x8, 1);

        s[8] = s[13] = s[18] = s[23] = "-";

        let uuid = s.join("");
        return uuid;
    } // createUUID
} // Blackthorn
