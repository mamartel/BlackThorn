// blackthorn.ts
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Blackthorn;
(function (Blackthorn) {
    ;
    var Agent = (function () {
        function Agent(subject, tree, blackboard) {
            this.tree = tree;
            this.blackboard = blackboard;
            this.ticker = new Ticker(subject, blackboard, tree);
        } // constructor
        Agent.prototype.tick = function () {
            this.tree.tick(this, this.blackboard, this.ticker);
        }; // tick
        return Agent;
    }());
    Blackthorn.Agent = Agent; // Agent
    var DedicatedAgent = (function (_super) {
        __extends(DedicatedAgent, _super);
        function DedicatedAgent(subject, tree) {
            _super.call(this, subject, tree, new Blackboard());
        }
        return DedicatedAgent;
    }(Agent));
    Blackthorn.DedicatedAgent = DedicatedAgent; // DedicatedAgent
    var Blackboard = (function () {
        function Blackboard() {
            this._baseMemory = {}; // used to store global information
            this._treeMemory = {}; // used to store tree and node information
        } // constructor
        Blackboard.prototype._getTreeMemory = function (treeScope) {
            if (!this._treeMemory[treeScope]) {
                this._treeMemory[treeScope] = {
                    "nodeMemory": {},
                    "openNodes": [],
                };
            }
            return this._treeMemory[treeScope];
        }; // _getTreeMemory
        Blackboard.prototype._getNodeMemory = function (treeMemory, nodeScope) {
            var memory = treeMemory["nodeMemory"];
            if (!memory[nodeScope]) {
                memory[nodeScope] = {};
            }
            return memory[nodeScope];
        }; // _getNodeMemory
        Blackboard.prototype._getMemory = function (treeScope, nodeScope) {
            var memory = this._baseMemory;
            if (treeScope) {
                memory = this._getTreeMemory(treeScope);
                if (nodeScope) {
                    memory = this._getNodeMemory(memory, nodeScope);
                }
            }
            return memory;
        }; // _getMemory
        Blackboard.prototype.set = function (key, value, treeScope, nodeScope) {
            var memory = this._getMemory(treeScope, nodeScope);
            memory[key] = value;
        }; // set
        Blackboard.prototype.get = function (key, treeScope, nodeScope) {
            var memory = this._getMemory(treeScope, nodeScope);
            return memory[key];
        }; // get
        return Blackboard;
    }());
    Blackthorn.Blackboard = Blackboard; // Heap
    var Ticker = (function () {
        function Ticker(subject, blackboard, tree) {
            this.tree = tree;
            this.openNodes = [];
            this.nodeCount = 0;
            this.debug = null;
            this.subject = subject;
            this.blackboard = blackboard;
        } // constructor
        Ticker.prototype.enterNode = function (node) {
            this.nodeCount++;
            this.openNodes.push(node);
            // call debug here
        }; // enterNode
        Ticker.prototype.openNode = function (node) {
            // call debug here
        }; // openNode
        Ticker.prototype.tickNode = function (node) {
            // call debug here
        }; // tickNode
        Ticker.prototype.closeNode = function (node) {
            // call debug here
            this.openNodes.pop();
        }; // closeNode
        Ticker.prototype.exitNode = function (node) {
            // call debug here
        }; // exitNode
        return Ticker;
    }());
    Blackthorn.Ticker = Ticker; // Ticker
    var BehaviorTree = (function () {
        function BehaviorTree(root) {
            this.id = createUUID();
            this.root = root;
        } // constructor
        BehaviorTree.prototype.tick = function (subject, blackboard, ticker) {
            if (!ticker) {
                /* CREATE A TICK OBJECT */
                ticker = new Ticker(subject, blackboard, this);
            }
            else {
                ticker.openNodes = [];
            }
            /* TICK NODE */
            this.root._execute(ticker);
            /* CLOSE NODES FROM LAST TICK, IF NEEDED */
            var lastOpenNodes = blackboard.get("openNodes", this.id);
            var currOpenNodes = ticker.openNodes;
            // does not close if it is still open in this tick
            var start = 0;
            for (var i = 0; i < Math.min(lastOpenNodes.length, currOpenNodes.length); i++) {
                start = i + 1;
                if (lastOpenNodes[i] !== currOpenNodes[i]) {
                    break;
                }
            }
            // close the nodes
            for (var i = lastOpenNodes.length - 1; i >= start; i--) {
                lastOpenNodes[i]._close(ticker);
            }
            /* POPULATE BLACKBOARD */
            blackboard.set("openNodes", currOpenNodes, this.id);
            blackboard.set("nodeCount", ticker.nodeCount, this.id);
        }; // tick
        return BehaviorTree;
    }());
    Blackthorn.BehaviorTree = BehaviorTree; // BehaviorTree
    var BaseNode = (function () {
        function BaseNode(children) {
            this.id = createUUID();
            this.children = [];
            if (children) {
                for (var i = 0; i < children.length; i++) {
                    this.children.push(children[i]);
                }
            }
        } // constructor
        BaseNode.prototype._execute = function (ticker) {
            /* ENTER */
            this._enter(ticker);
            /* OPEN */
            if (!ticker.blackboard.get("isOpen", ticker.tree.id, this.id)) {
                this._open(ticker);
            }
            /* TICK */
            var status = this._tick(ticker);
            /* CLOSE */
            if (status !== 2 /* RUNNING */) {
                this._close(ticker);
            }
            /* EXIT */
            this._exit(ticker);
            return status;
        }; // execute
        // Wrapper functions
        BaseNode.prototype._enter = function (ticker) {
            ticker.enterNode(this);
            this.enter(ticker);
        }; // _enter
        BaseNode.prototype._open = function (ticker) {
            ticker.openNode(this);
            ticker.blackboard.set("isOpen", true, ticker.tree.id, this.id);
            this.open(ticker);
        }; // _open
        BaseNode.prototype._tick = function (ticker) {
            ticker.tickNode(this);
            return this.tick(ticker);
        }; // _tick
        BaseNode.prototype._close = function (ticker) {
            ticker.closeNode(this);
            ticker.blackboard.set("isOpen", false, ticker.tree.id, this.id);
            this.close(ticker);
        }; // _close
        BaseNode.prototype._exit = function (ticker) {
            ticker.exitNode(this);
            this.exit(ticker);
        }; // _exit
        // Override these to create nodes
        BaseNode.prototype.enter = function (ticker) { };
        BaseNode.prototype.open = function (ticker) { };
        BaseNode.prototype.close = function (ticker) { };
        BaseNode.prototype.exit = function (ticker) { };
        return BaseNode;
    }());
    Blackthorn.BaseNode = BaseNode; // BaseNote
    var Action = (function (_super) {
        __extends(Action, _super);
        function Action() {
            _super.call(this);
        } // constructor
        return Action;
    }(BaseNode));
    Blackthorn.Action = Action; // Action
    var Composite = (function (_super) {
        __extends(Composite, _super);
        function Composite() {
            var children = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                children[_i - 0] = arguments[_i];
            }
            _super.call(this, children);
        } // constructor
        return Composite;
    }(BaseNode));
    Blackthorn.Composite = Composite; // Composite
    var Decorator = (function (_super) {
        __extends(Decorator, _super);
        function Decorator(child) {
            _super.call(this, [child]);
        } // constructor
        return Decorator;
    }(BaseNode));
    Blackthorn.Decorator = Decorator; // Decorator<T>
    var Condition = (function (_super) {
        __extends(Condition, _super);
        function Condition(condition, onTrue, onFalse) {
            _super.call(this);
            this._condition = condition;
            this._onTrue = onTrue;
            this._onFalse = onFalse;
        }
        Condition.prototype.tick = function (ticker) {
            return this._condition(ticker)
                ? this._onTrue.tick(ticker)
                : this._onFalse.tick(ticker);
        };
        return Condition;
    }(Action));
    Blackthorn.Condition = Condition; // Condition
    var Sequence = (function (_super) {
        __extends(Sequence, _super);
        function Sequence() {
            _super.apply(this, arguments);
        }
        Sequence.prototype.tick = function (ticker) {
            for (var i = 0; i < this.children.length; i++) {
                var status_1 = this.children[i]._execute(ticker);
                if (status_1 !== 1 /* SUCCESS */) {
                    return status_1;
                }
            }
            return 1 /* SUCCESS */;
        }; // tick
        return Sequence;
    }(Composite));
    Blackthorn.Sequence = Sequence; // Sequence
    var Selector = (function (_super) {
        __extends(Selector, _super);
        function Selector() {
            _super.apply(this, arguments);
        }
        Selector.prototype.tick = function (ticker) {
            for (var i = 0; i < this.children.length; i++) {
                var status_2 = this.children[i]._execute(ticker);
                if (status_2 !== 0 /* FAILURE */) {
                    return status_2;
                }
            }
            return 0 /* FAILURE */;
        }; // tick
        return Selector;
    }(Composite));
    Blackthorn.Selector = Selector; // Selector
    var MemSequence = (function (_super) {
        __extends(MemSequence, _super);
        function MemSequence() {
            _super.apply(this, arguments);
        }
        MemSequence.prototype.open = function (ticker) {
            _super.prototype.open.call(this, ticker);
            ticker.blackboard.set("runningChild", 0, ticker.tree.id, this.id);
        }; // open
        MemSequence.prototype.tick = function (ticker) {
            var childIndex = ticker.blackboard.get("runningChild", ticker.tree.id, this.id);
            for (var i = childIndex; i < this.children.length; i++) {
                var status_3 = this.children[i]._execute(ticker);
                if (status_3 !== 1 /* SUCCESS */) {
                    if (status_3 === 2 /* RUNNING */) {
                        ticker.blackboard.set("runningChild", i, ticker.tree.id, this.id);
                    }
                    return status_3;
                }
            }
            return 1 /* SUCCESS */;
        }; // tick
        return MemSequence;
    }(Composite));
    Blackthorn.MemSequence = MemSequence; // MemSequence
    var MemSelector = (function (_super) {
        __extends(MemSelector, _super);
        function MemSelector() {
            _super.apply(this, arguments);
        }
        MemSelector.prototype.open = function (ticker) {
            _super.prototype.open.call(this, ticker);
            ticker.blackboard.set("runningChild", 0, ticker.tree.id, this.id);
        }; // open
        MemSelector.prototype.tick = function (ticker) {
            var childIndex = ticker.blackboard.get("runningChild", ticker.tree.id, this.id);
            for (var i = childIndex; i < this.children.length; i++) {
                var status_4 = this.children[i]._execute(ticker);
                if (status_4 !== 0 /* FAILURE */) {
                    if (status_4 === 2 /* RUNNING */) {
                        ticker.blackboard.set("runningChild", i, ticker.tree.id, this.id);
                    }
                    return status_4;
                }
            }
            return 0 /* FAILURE */;
        }; // tick
        return MemSelector;
    }(Composite));
    Blackthorn.MemSelector = MemSelector; // MemSelector
    var RandomSelector = (function (_super) {
        __extends(RandomSelector, _super);
        function RandomSelector() {
            _super.apply(this, arguments);
        }
        RandomSelector.prototype.tick = function (ticker) {
            var childIndex = (Math.random() * this.children.length) | 0;
            var child = this.children[childIndex];
            var status = child._execute(ticker);
            return status;
        }; // tick
        return RandomSelector;
    }(Composite));
    Blackthorn.RandomSelector = RandomSelector; // RandomSelector
    /*
        export class Concurrent extends Composite {
            successThreshold: number;
            childrenResult: Status[];
            nbSuccess: number;
            nbFailure: number;
    
            constructor(successThreshold: number, ...children: BaseNode[]) {
                super(children);
                this.childrenResult = new Array(children.length);
                this.successThreshold = successThreshold;
            } // constructor
    
            open(ticker: Ticker): void {
                super.open(ticker);
                ticker.blackboard.set("runningChild", 0, ticker.tree.id, this.id);
                this.nbSuccess = 0;
                this.nbFailure = 0;
            } // open
    
            tick(ticker: Ticker): Status {
                let childIndex = ticker.blackboard.get("runningChild", ticker.tree.id, this.id) as number;
    
                for (let i = childIndex; i < this.children.length; i++) {
                    let status = this.children[i]._execute(ticker);
    
                    if (status === Status.SUCCESS) {
                        this.nbSuccess++;
                        if (status === Status.RUNNING) {
                            ticker.blackboard.set("runningChild", i, ticker.tree.id, this.id);
                        }
                    }
                }
    
                for (let i = 0; i < this.children.length; i++) {
                    let status = this.children[i]._execute(ticker);
    
                    if (status === Status.FAILURE) {
                        nbSuccess++;
                    }
                }
    
                if (nbSuccess === this.children.length) {
                    return Status.FAILURE;
                }
    
                return Status.SUCCESS;
            } // tick
        } // Concurrent
    */
    var Inverter = (function (_super) {
        __extends(Inverter, _super);
        function Inverter() {
            _super.apply(this, arguments);
        }
        Inverter.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            var status = child._execute(ticker);
            if (status === 1 /* SUCCESS */)
                status = 0 /* FAILURE */;
            else if (status === 0 /* FAILURE */)
                status = 1 /* SUCCESS */;
            return status;
        }; // tick
        return Inverter;
    }(Decorator));
    Blackthorn.Inverter = Inverter; // Inverter
    var LimiterTime = (function (_super) {
        __extends(LimiterTime, _super);
        function LimiterTime(maxTime, child) {
            _super.call(this, child);
            this.maxTime = maxTime;
        } // constructor
        LimiterTime.prototype.open = function (ticker) {
            _super.prototype.open.call(this, ticker);
            var startTime = (new Date()).getTime();
            ticker.blackboard.set("startTime", startTime, ticker.tree.id, this.id);
        }; // open
        LimiterTime.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            var currTime = (new Date()).getTime();
            var startTime = ticker.blackboard.get("startTime", ticker.tree.id, this.id);
            if (currTime - startTime > this.maxTime) {
                return 0 /* FAILURE */;
            }
            return child._execute(ticker);
        }; // tick
        return LimiterTime;
    }(Decorator));
    Blackthorn.LimiterTime = LimiterTime; // LimiterTime
    var LimiterTicks = (function (_super) {
        __extends(LimiterTicks, _super);
        function LimiterTicks(maxTicks, child) {
            _super.call(this, child);
            this.maxTicks = maxTicks;
            this.elapsedTicks = 0;
        } // constructor
        LimiterTicks.prototype.open = function (ticker) {
            _super.prototype.open.call(this, ticker);
            this.elapsedTicks = 0;
        }; // open
        LimiterTicks.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            if (++this.elapsedTicks > this.maxTicks) {
                this.elapsedTicks = 0;
                return 0 /* FAILURE */;
            }
            return child._execute(ticker);
        }; // tick
        return LimiterTicks;
    }(Decorator));
    Blackthorn.LimiterTicks = LimiterTicks; // LimiterTicks
    var Repeater = (function (_super) {
        __extends(Repeater, _super);
        function Repeater(child, maxLoop) {
            if (maxLoop === void 0) { maxLoop = -1; }
            _super.call(this, child);
            this.maxLoop = maxLoop;
        } // constructor
        Repeater.prototype.open = function (ticker) {
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        }; // open
        Repeater.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            var i = ticker.blackboard.get("i", ticker.tree.id, this.id);
            var status = 1 /* SUCCESS */;
            while (this.maxLoop < 0 || i < this.maxLoop) {
                status = child._execute(ticker);
                if (status === 1 /* SUCCESS */ || status === 0 /* FAILURE */)
                    i++;
                else
                    break;
            }
            ticker.blackboard.set("i", i, ticker.tree.id, this.id);
            return status;
        }; // tick
        return Repeater;
    }(Decorator));
    Blackthorn.Repeater = Repeater; // Repeater
    var RepeatUntilFailure = (function (_super) {
        __extends(RepeatUntilFailure, _super);
        function RepeatUntilFailure(child, maxLoop) {
            if (maxLoop === void 0) { maxLoop = -1; }
            _super.call(this, child);
            this.maxLoop = maxLoop;
        } // constructor
        RepeatUntilFailure.prototype.open = function (ticker) {
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        }; // open
        RepeatUntilFailure.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            var i = ticker.blackboard.get("i", ticker.tree.id, this.id);
            var status = 1 /* SUCCESS */;
            while (this.maxLoop < 0 || i < this.maxLoop) {
                status = child._execute(ticker);
                if (status === 1 /* SUCCESS */)
                    i++;
                else
                    break;
            }
            ticker.blackboard.set("i", i, ticker.tree.id, this.id);
            return status;
        }; // tick
        return RepeatUntilFailure;
    }(Decorator));
    Blackthorn.RepeatUntilFailure = RepeatUntilFailure; // RepeatUntilFailure
    var RepeatUntilSuccess = (function (_super) {
        __extends(RepeatUntilSuccess, _super);
        function RepeatUntilSuccess(child, maxLoop) {
            if (maxLoop === void 0) { maxLoop = -1; }
            _super.call(this, child);
            this.maxLoop = maxLoop;
        } // constructor
        RepeatUntilSuccess.prototype.open = function (ticker) {
            ticker.blackboard.set("i", 0, ticker.tree.id, this.id);
        }; // open
        RepeatUntilSuccess.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            var i = ticker.blackboard.get("i", ticker.tree.id, this.id);
            var status = 0 /* FAILURE */;
            while (this.maxLoop < 0 || i < this.maxLoop) {
                status = child._execute(ticker);
                if (status === 0 /* FAILURE */)
                    i++;
                else
                    break;
            }
            ticker.blackboard.set("i", i, ticker.tree.id, this.id);
            return status;
        }; // tick
        return RepeatUntilSuccess;
    }(Decorator));
    Blackthorn.RepeatUntilSuccess = RepeatUntilSuccess; // RepeatUntilSuccess
    var Failer = (function (_super) {
        __extends(Failer, _super);
        function Failer() {
            _super.apply(this, arguments);
        }
        Failer.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            child._execute(ticker);
            return 0 /* FAILURE */;
        }; // tick
        return Failer;
    }(Decorator));
    Blackthorn.Failer = Failer; // Failer
    var Runner = (function (_super) {
        __extends(Runner, _super);
        function Runner() {
            _super.apply(this, arguments);
        }
        Runner.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            child._execute(ticker);
            return 2 /* RUNNING */;
        }; // tick
        return Runner;
    }(Decorator));
    Blackthorn.Runner = Runner; // Runner
    var Succeeder = (function (_super) {
        __extends(Succeeder, _super);
        function Succeeder() {
            _super.apply(this, arguments);
        }
        Succeeder.prototype.tick = function (ticker) {
            if (this.children.length !== 1) {
                return 3 /* ERROR */;
            }
            var child = this.children[0];
            child._execute(ticker);
            return 1 /* SUCCESS */;
        }; // tick
        return Succeeder;
    }(Decorator));
    Blackthorn.Succeeder = Succeeder; // Succeeder
    var Error = (function (_super) {
        __extends(Error, _super);
        function Error() {
            _super.apply(this, arguments);
        }
        Error.prototype.tick = function (ticker) {
            return 3 /* ERROR */;
        }; // tick
        return Error;
    }(Action));
    Blackthorn.Error = Error; // Error
    var Failure = (function (_super) {
        __extends(Failure, _super);
        function Failure() {
            _super.apply(this, arguments);
        }
        Failure.prototype.tick = function (ticker) {
            return 0 /* FAILURE */;
        }; // tick
        return Failure;
    }(Action));
    Blackthorn.Failure = Failure; // Failure
    var Running = (function (_super) {
        __extends(Running, _super);
        function Running() {
            _super.apply(this, arguments);
        }
        Running.prototype.tick = function (ticker) {
            return 2 /* RUNNING */;
        }; // tick
        return Running;
    }(Action));
    Blackthorn.Running = Running; // Running
    var Success = (function (_super) {
        __extends(Success, _super);
        function Success() {
            _super.apply(this, arguments);
        }
        Success.prototype.tick = function (ticker) {
            return 1 /* SUCCESS */;
        }; // tick
        return Success;
    }(Action));
    Blackthorn.Success = Success; // Success
    var WaitTime = (function (_super) {
        __extends(WaitTime, _super);
        function WaitTime(duration) {
            if (duration === void 0) { duration = 0; }
            _super.call(this);
            this.duration = duration;
        } // constructor
        WaitTime.prototype.open = function (ticker) {
            var startTime = (new Date()).getTime();
            ticker.blackboard.set("startTime", startTime, ticker.tree.id, this.id);
        };
        WaitTime.prototype.tick = function (ticker) {
            var currTime = (new Date()).getTime();
            var startTime = ticker.blackboard.get("startTime", ticker.tree.id, this.id);
            if (currTime - startTime >= this.duration) {
                return 1 /* SUCCESS */;
            }
            return 2 /* RUNNING */;
        };
        return WaitTime;
    }(Action));
    Blackthorn.WaitTime = WaitTime; // WaitTime
    var WaitTicks = (function (_super) {
        __extends(WaitTicks, _super);
        function WaitTicks(duration) {
            if (duration === void 0) { duration = 0; }
            _super.call(this);
            this.duration = duration;
            this.elapsedTicks = 0;
        } // constructor
        WaitTicks.prototype.open = function (ticker) {
            this.elapsedTicks = 0;
        };
        WaitTicks.prototype.tick = function (ticker) {
            if (++this.elapsedTicks >= this.duration) {
                this.elapsedTicks = 0;
                return 1 /* SUCCESS */;
            }
            return 2 /* RUNNING */;
        };
        return WaitTicks;
    }(Action));
    Blackthorn.WaitTicks = WaitTicks; // WaitTicks
    function createUUID() {
        var s = Array(36);
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        // bits 12-15 of the time_hi_and_version field to 0010
        s[14] = "4";
        // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[19] = hexDigits.substr((parseInt(s[19], 16) & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";
        var uuid = s.join("");
        return uuid;
    } // createUUID
})(Blackthorn = exports.Blackthorn || (exports.Blackthorn = {})); // Blackthorn
//# sourceMappingURL=blackthorn.js.map