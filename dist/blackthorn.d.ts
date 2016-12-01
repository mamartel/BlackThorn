export declare const enum Status {
    FAILURE = 0,
    SUCCESS = 1,
    RUNNING = 2,
    ERROR = 3,
}
export declare class Agent<T> {
    tree: BehaviorTree<T>;
    blackboard: Blackboard;
    ticker: Ticker<T>;
    constructor(subject: T, tree: BehaviorTree<T>, blackboard: Blackboard);
    tick(): void;
}
export declare class DedicatedAgent<T> extends Agent<T> {
    constructor(subject: T, tree: BehaviorTree<T>);
}
export declare class Blackboard {
    private _baseMemory;
    private _treeMemory;
    constructor();
    private _getTreeMemory(treeScope);
    private _getNodeMemory(treeMemory, nodeScope);
    private _getMemory(treeScope?, nodeScope?);
    set(key: string, value: any, treeScope?: string, nodeScope?: string): void;
    get(key: string, treeScope?: string, nodeScope?: string): any;
}
export declare class Ticker<T> {
    tree: BehaviorTree<T>;
    openNodes: BaseNode<T>[];
    nodeCount: number;
    debug: any;
    subject: T;
    blackboard: Blackboard;
    constructor(subject: T, blackboard: Blackboard, tree: BehaviorTree<T>);
    enterNode(node: BaseNode<T>): void;
    openNode(node: BaseNode<T>): void;
    tickNode(node: BaseNode<T>): void;
    closeNode(node: BaseNode<T>): void;
    exitNode(node: BaseNode<T>): void;
}
export declare class BehaviorTree<T> {
    id: string;
    root: BaseNode<T>;
    constructor(root: BaseNode<T>);
    tick(subject: any, blackboard: Blackboard, ticker?: Ticker<T>): void;
}
export declare abstract class BaseNode<T> {
    id: string;
    children: BaseNode<T>[];
    constructor(children?: BaseNode<T>[]);
    _execute(ticker: Ticker<T>): Status;
    _enter(ticker: Ticker<T>): void;
    _open(ticker: Ticker<T>): void;
    _tick(ticker: Ticker<T>): Status;
    _close(ticker: Ticker<T>): void;
    _exit(ticker: Ticker<T>): void;
    enter(ticker: Ticker<T>): void;
    open(ticker: Ticker<T>): void;
    abstract tick(ticker: Ticker<T>): Status;
    close(ticker: Ticker<T>): void;
    exit(ticker: Ticker<T>): void;
}
export declare abstract class Action<T> extends BaseNode<T> {
    constructor();
}
export declare abstract class Composite<T> extends BaseNode<T> {
    constructor(...children: BaseNode<T>[]);
}
export declare abstract class Decorator<T> extends BaseNode<T> {
    constructor(child: BaseNode<T>);
}
export declare class Condition<T> extends Action<T> {
    private _condition;
    private _onTrue;
    private _onFalse;
    constructor(condition: (ticker: Ticker<T>) => boolean, onTrue: BaseNode<T>, onFalse: BaseNode<T>);
    tick(ticker: Ticker<T>): Status;
}
export declare class Sequence<T> extends Composite<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Selector<T> extends Composite<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class MemSequence<T> extends Composite<T> {
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class MemSelector<T> extends Composite<T> {
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class RandomSelector<T> extends Composite<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Inverter<T> extends Decorator<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class LimiterTime<T> extends Decorator<T> {
    maxTime: number;
    constructor(maxTime: number, child: BaseNode<T>);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class LimiterTicks<T> extends Decorator<T> {
    maxTicks: number;
    elapsedTicks: number;
    constructor(maxTicks: number, child: BaseNode<T>);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class Repeater<T> extends Decorator<T> {
    maxLoop: number;
    constructor(child: BaseNode<T>, maxLoop?: number);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class RepeatUntilFailure<T> extends Decorator<T> {
    maxLoop: number;
    constructor(child: BaseNode<T>, maxLoop?: number);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class RepeatUntilSuccess<T> extends Decorator<T> {
    maxLoop: number;
    constructor(child: BaseNode<T>, maxLoop?: number);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class Failer<T> extends Decorator<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Runner<T> extends Decorator<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Succeeder<T> extends Decorator<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Error<T> extends Action<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Failure<T> extends Action<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Running<T> extends Action<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class Success<T> extends Action<T> {
    tick(ticker: Ticker<T>): Status;
}
export declare class WaitTime<T> extends Action<T> {
    duration: number;
    constructor(duration?: number);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
export declare class WaitTicks<T> extends Action<T> {
    duration: number;
    elapsedTicks: number;
    constructor(duration?: number);
    open(ticker: Ticker<T>): void;
    tick(ticker: Ticker<T>): Status;
}
