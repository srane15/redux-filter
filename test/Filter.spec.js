import React, { PropTypes, Component } from 'react';
import TestUtils from 'react-addons-test-utils';
import expect, { spyOn } from 'expect';
import jsdom from 'mocha-jsdom';
import Filter from '../src/index.js';
import testConfig from './testConfig.js';



expect.extend({
    toBeDefined() {
        expect.assert(
          this.actual !== undefined,
          'expected %s to be defined',
          this.actual
        );
    }
});

expect.extend({
    toBeAFunction() {
        expect.assert(
          (typeof this.actual === 'function'),
          'expected %s to be a function',
          this.actual
        );
    }
});


describe('Filter Component', () => {
    jsdom();

    class Child extends Component {

        render() {
            return <div>Test</div>;
        }
    }

    const render = () => {
        const spy = spyOn(console, 'error');
        const tree = TestUtils.renderIntoDocument(
          <Filter {...testConfig}>
              <Child />
          </Filter>
        );
        expect(spy.calls.length).toBe(0);
        return tree;
    };

    const makeChild = () => {
        const tree = TestUtils.renderIntoDocument(
          <Filter {...testConfig}>
              <Child />
          </Filter>
        );
        return TestUtils.findRenderedComponentWithType(tree, Child);
    };


    it('should enforce a single child', () => {

        expect(() => TestUtils.renderIntoDocument(
          <Filter>
              <Child />
          </Filter>
        )).toNotThrow();

        expect(() => TestUtils.renderIntoDocument(
          <Filter>
              <Child />
              <Child />
          </Filter>
        )).toThrow(/exactly one child/);

    });

    it('should enforce a react component as child', () => {
        expect(() => TestUtils.renderIntoDocument(
          <Filter>
              <Child />
          </Filter>
        )).toNotThrow();

        expect(() => TestUtils.renderIntoDocument(
          <Filter>
              <div />
          </Filter>
        )).toThrow(/child must be a react component, not a dom element/);
    });

    describe('should inject objects as props into child', () => {

        const testProps = ['collection',
            'optionGroups',
            'keyword',
            'appliedFilters',
            'sortItems',
            'sortFn'];

        testProps.forEach(prop => {
            it(`correctly injects ${prop} into child`, () => {
                const child = TestUtils.findRenderedComponentWithType(render(), Child);
                expect(child.props[prop]).toBeDefined();
            });
        });

    });

    describe('should inject functions as props into child', () => {
        const testFunctions = ['toggleFilter',
            'toggleOnly',
            'clearFilters',
            'keywordSearch',
            'applySort',
            'clearAllFilters'];
        testFunctions.forEach(prop => {
            it(`correctly injects ${prop} as a function into child`, () => {
                const child = TestUtils.findRenderedComponentWithType(render(), Child);
                expect(child.props[prop]).toBeAFunction();
            });
        });
    });

    describe('should filter single item correctly', () => {

        const singleActions = [
            {action: 'toggleFilter', args: ['type', 'foo'], subjects: [{title: 'foo', type: 'foo'}]},
            {action: 'toggleFilter', args: ['type', 'bar'], subjects: [{title: 'bar', type: 'bar'}]},
            {action: 'clearAllFilters', args: [], subjects: [{title: 'foo', type: 'foo'}, {title: 'bar', type: 'bar'}]}
        ];

        singleActions.forEach(test => {
            it(`should return correct subjects when ${test.action} is called with ${test.args}`, () => {
                const child = makeChild();
                // call action
                child.props[test.action].apply(child, test.args);
                expect(child.props.collection).toEqual(test.subjects);
            });
        });

    });

    describe('should filter correctly with multiple actions', () => {

        const sequences = [
            [
                {
                    fn: 'toggleFilter',
                    args: ['type', 'bar'],
                    result: [{title: 'bar', type: 'bar'}]
                },
                {
                    fn: 'toggleFilter',
                    args: ['type', 'bar'],
                    result: [{title: 'foo', type: 'foo'}, {title: 'bar', type: 'bar'}]
                }
            ],
            [
                {
                    fn: 'toggleFilter',
                    args: ['type', 'bar'],
                    result: [{title: 'bar', type: 'bar'}]
                },
                {
                    fn: 'toggleFilter',
                    args: ['type', 'bar'],
                    result: [{title: 'foo', type: 'foo'}, {title: 'bar', type: 'bar'}]
                },
                {
                    fn: 'toggleFilter',
                    args: ['type', 'bar'],
                    result: [{title: 'bar', type: 'bar'}]
                },
                {
                    fn: 'toggleFilter',
                    args: ['type', 'foo'],
                    result: [{title: 'foo', type: 'foo'}, {title: 'bar', type: 'bar'}]
                }
            ]
        ];

        sequences.forEach(seq => {
            describe(`should have the correct subjects after each`, () => {
                let child;
                seq.forEach((obj, index) => {
                    it(`should have the correct subjects after ${obj.fn}`, () => {
                        if (index === 0) {
                            child = makeChild();
                        }
                        child.props[obj.fn].apply(child, obj.args);
                        expect(child.props.collection).toEqual(obj.result);
                    });
                });
            });
        });


    });

});
