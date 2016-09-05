declare namespace Blackthorn {
    const enum Status {
        FAILURE = 0,
        SUCCESS = 1,
        RUNNING = 2,
        ERROR = 3,
    }
    class Agent {
        tree: BehaviorTree;
        blackboard: Blackboard;
        ticker: Ticker;
        constructor(subject: any, tree: BehaviorTree, blackboard: Blackboard);
        tick(): void;
    }
    class DedicatedAgent extends Agent {
        constructor(subject: any, tree: BehaviorTree);
    }
    class Blackboard {
        private _baseMemory;
        private _treeMemory;
        constructor();
        private _getTreeMemory(treeScope);
        private _getNodeMemory(treeMemory, nodeScope);
        private _getMemory(treeScope?, nodeScope?);
        set(key: string, value: any, treeScope?: string, nodeScope?: string): void;
        get(key: string, treeScope?: string, nodeScope?: string): any;
    }
    class Ticker {
        tree: BehaviorTree;
        openNodes: BaseNode[];
        nodeCount: number;
        debug: any;
        subject: any;
        blackboard: Blackboard;
        constructor(subject: any, blackboard: Blackboard, tree: BehaviorTree);
        enterNode(node: BaseNode): void;
        openNode(node: BaseNode): void;
        tickNode(node: BaseNode): void;
        closeNode(node: BaseNode): void;
        exitNode(node: BaseNode): void;
    }
    class BehaviorTree {
        id: string;
        root: BaseNode;
        constructor(root: BaseNode);
        tick(subject: any, blackboard: Blackboard, ticker?: Ticker): void;
    }
    abstract class BaseNode {
        id: string;
        children: BaseNode[];
        constructor(children?: BaseNode[]);
        _execute(ticker: Ticker): Status;
        _enter(ticker: Ticker): void;
        _open(ticker: Ticker): void;
        _tick(ticker: Ticker): Status;
        _close(ticker: Ticker): void;
        _exit(ticker: Ticker): void;
        enter(ticker: Ticker): void;
        open(ticker: Ticker): void;
        abstract tick(ticker: Ticker): Status;
        close(ticker: Ticker): void;
        exit(ticker: Ticker): void;
    }
    abstract class Action extends BaseNode {
        constructor();
    }
    abstract class Composite extends BaseNode {
        constructor(...children: BaseNode[]);
    }
    abstract class Decorator extends BaseNode {
        constructor(child: BaseNode);
    }
    abstract class Condition extends Action {
    }
    class Sequence extends Composite {
        tick(ticker: Ticker): Status;
    }
    class Selector extends Composite {
        tick(ticker: Ticker): Status;
    }
    class MemSequence extends Composite {
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class MemSelector extends Composite {
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class RandomSelector extends Composite {
        tick(ticker: Ticker): Status;
    }
    class Inverter extends Decorator {
        tick(ticker: Ticker): Status;
    }
    class LimiterTime extends Decorator {
        maxTime: number;
        constructor(maxTime: number, child: BaseNode);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class LimiterTicks extends Decorator {
        maxTicks: number;
        elapsedTicks: number;
        constructor(maxTicks: number, child: BaseNode);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class Repeater extends Decorator {
        maxLoop: number;
        constructor(child: BaseNode, maxLoop?: number);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class RepeatUntilFailure extends Decorator {
        maxLoop: number;
        constructor(child: BaseNode, maxLoop?: number);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class RepeatUntilSuccess extends Decorator {
        maxLoop: number;
        constructor(child: BaseNode, maxLoop?: number);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class Failer extends Decorator {
        tick(ticker: Ticker): Status;
    }
    class Runner extends Decorator {
        tick(ticker: Ticker): Status;
    }
    class Succeeder extends Decorator {
        tick(ticker: Ticker): Status;
    }
    class Error extends Action {
        tick(ticker: Ticker): Status;
    }
    class Failure extends Action {
        tick(ticker: Ticker): Status;
    }
    class Running extends Action {
        tick(ticker: Ticker): Status;
    }
    class Success extends Action {
        tick(ticker: Ticker): Status;
    }
    class WaitTime extends Action {
        duration: number;
        constructor(duration?: number);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
    class WaitTicks extends Action {
        duration: number;
        elapsedTicks: number;
        constructor(duration?: number);
        open(ticker: Ticker): void;
        tick(ticker: Ticker): Status;
    }
}
