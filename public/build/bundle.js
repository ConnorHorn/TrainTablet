
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\StopButton.svelte generated by Svelte v3.48.0 */

    const file$6 = "src\\StopButton.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Stop";
    			attr_dev(button, "class", "btn btn-error w-[300px] h-[250px] fixed text-6xl text-white");
    			add_location(button, file$6, 7, 0, 57);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", stop, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function stop() {
    	
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StopButton', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StopButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ stop });
    	return [];
    }

    class StopButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StopButton",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const screenWidth = writable(1280);
    const screenHeight = writable(800);
    const diagnostics = writable(["hi","hello", "bye"]);
    const speed = writable(88);
    const overrideSensors = writable(false);
    const forward=writable(false);
    const reverse=writable(false);

    //-----

    const currentSpeed = writable(0);
    const voltage = writable(0);
    const draw = writable(0);
    const distance = writable(0);

    /* src\Border.svelte generated by Svelte v3.48.0 */
    const file$5 = "src\\Border.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let rect;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			attr_dev(rect, "width", /*$screenWidth*/ ctx[0]);
    			attr_dev(rect, "height", /*$screenHeight*/ ctx[1]);
    			set_style(rect, "fill", "none");
    			set_style(rect, "stroke-width", "5");
    			set_style(rect, "stroke", "black");
    			add_location(rect, file$5, 6, 4, 151);
    			attr_dev(svg, "width", /*$screenWidth*/ ctx[0]);
    			attr_dev(svg, "height", /*$screenHeight*/ ctx[1]);
    			attr_dev(svg, "class", "fixed");
    			add_location(svg, file$5, 5, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$screenWidth*/ 1) {
    				attr_dev(rect, "width", /*$screenWidth*/ ctx[0]);
    			}

    			if (dirty & /*$screenHeight*/ 2) {
    				attr_dev(rect, "height", /*$screenHeight*/ ctx[1]);
    			}

    			if (dirty & /*$screenWidth*/ 1) {
    				attr_dev(svg, "width", /*$screenWidth*/ ctx[0]);
    			}

    			if (dirty & /*$screenHeight*/ 2) {
    				attr_dev(svg, "height", /*$screenHeight*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $screenWidth;
    	let $screenHeight;
    	validate_store(screenWidth, 'screenWidth');
    	component_subscribe($$self, screenWidth, $$value => $$invalidate(0, $screenWidth = $$value));
    	validate_store(screenHeight, 'screenHeight');
    	component_subscribe($$self, screenHeight, $$value => $$invalidate(1, $screenHeight = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Border', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Border> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		screenHeight,
    		screenWidth,
    		$screenWidth,
    		$screenHeight
    	});

    	return [$screenWidth, $screenHeight];
    }

    class Border extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Border",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\SetPointBox.svelte generated by Svelte v3.48.0 */
    const file$4 = "src\\SetPointBox.svelte";

    function create_fragment$4(ctx) {
    	let svg0;
    	let rect;
    	let t0;
    	let button0;
    	let svg1;
    	let path0;
    	let t1;
    	let button1;
    	let svg2;
    	let path1;
    	let t2;
    	let button2;
    	let t3;
    	let button2_class_value;
    	let t4;
    	let div;

    	let t5_value = (/*$speed*/ ctx[1].toString().length <= 1
    	? "0" + /*$speed*/ ctx[1].toString()
    	: /*$speed*/ ctx[1].toString()) + "";

    	let t5;
    	let t6;
    	let button3;
    	let t7;
    	let button3_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			svg0 = svg_element("svg");
    			rect = svg_element("rect");
    			t0 = space();
    			button0 = element("button");
    			svg1 = svg_element("svg");
    			path0 = svg_element("path");
    			t1 = space();
    			button1 = element("button");
    			svg2 = svg_element("svg");
    			path1 = svg_element("path");
    			t2 = space();
    			button2 = element("button");
    			t3 = text("REV");
    			t4 = space();
    			div = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			button3 = element("button");
    			t7 = text("FWD");
    			attr_dev(rect, "width", "500");
    			attr_dev(rect, "height", "300");
    			set_style(rect, "fill", "none");
    			set_style(rect, "stroke-width", "10");
    			set_style(rect, "stroke", "dodgerblue");
    			add_location(rect, file$4, 24, 4, 297);
    			attr_dev(svg0, "width", "500");
    			attr_dev(svg0, "height", "300");
    			attr_dev(svg0, "class", "fixed");
    			add_location(svg0, file$4, 23, 0, 251);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M12 4v16m8-8H4");
    			add_location(path0, file$4, 30, 8, 659);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "h-20 w-20");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "stroke-width", "2");
    			add_location(svg1, file$4, 29, 4, 520);
    			attr_dev(button0, "class", "btn btn-outline btn-success fixed w-[125px] h-[125px] mt-[80px] ml-[330px] border-8");
    			add_location(button0, file$4, 28, 0, 391);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M20 12H4");
    			add_location(path1, file$4, 36, 8, 1026);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "h-20 w-20");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "stroke-width", "2");
    			add_location(svg2, file$4, 35, 4, 887);
    			attr_dev(button1, "class", "btn btn-outline btn-error fixed w-[125px] h-[125px] mt-[80px] ml-[30px] border-8");
    			add_location(button1, file$4, 34, 0, 760);
    			attr_dev(button2, "class", button2_class_value = "btn " + (/*$reverse*/ ctx[0] ? '' : 'btn-outline') + " btn-secondary fixed w-[125px] h-[65px] mt-[220px] ml-[70px] border-4 text-2xl font-bold");
    			add_location(button2, file$4, 40, 0, 1121);
    			attr_dev(div, "class", "text-7xl mt-[100px] ml-[203px] fixed font-bold text-primary");
    			add_location(div, file$4, 44, 0, 1313);
    			attr_dev(button3, "class", button3_class_value = "btn " + (/*$forward*/ ctx[2] ? '' : 'btn-outline') + " btn-primary fixed w-[125px] h-[65px] mt-[220px] ml-[290px] border-4 text-2xl font-bold");
    			add_location(button3, file$4, 48, 0, 1481);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg0, anchor);
    			append_dev(svg0, rect);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button0, anchor);
    			append_dev(button0, svg1);
    			append_dev(svg1, path0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, svg2);
    			append_dev(svg2, path1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button2, anchor);
    			append_dev(button2, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, button3, anchor);
    			append_dev(button3, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", minusButton, false, false, false),
    					listen_dev(button1, "click", plusButton(), false, false, false),
    					listen_dev(button2, "click", reverseButton, false, false, false),
    					listen_dev(button3, "click", forwardButton, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$reverse*/ 1 && button2_class_value !== (button2_class_value = "btn " + (/*$reverse*/ ctx[0] ? '' : 'btn-outline') + " btn-secondary fixed w-[125px] h-[65px] mt-[220px] ml-[70px] border-4 text-2xl font-bold")) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (dirty & /*$speed*/ 2 && t5_value !== (t5_value = (/*$speed*/ ctx[1].toString().length <= 1
    			? "0" + /*$speed*/ ctx[1].toString()
    			: /*$speed*/ ctx[1].toString()) + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*$forward*/ 4 && button3_class_value !== (button3_class_value = "btn " + (/*$forward*/ ctx[2] ? '' : 'btn-outline') + " btn-primary fixed w-[125px] h-[65px] mt-[220px] ml-[290px] border-4 text-2xl font-bold")) {
    				attr_dev(button3, "class", button3_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(button3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function reverseButton() {
    	
    }

    function forwardButton() {
    	
    }

    function plusButton() {
    	
    }

    function minusButton() {
    	
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $reverse;
    	let $speed;
    	let $forward;
    	validate_store(reverse, 'reverse');
    	component_subscribe($$self, reverse, $$value => $$invalidate(0, $reverse = $$value));
    	validate_store(speed, 'speed');
    	component_subscribe($$self, speed, $$value => $$invalidate(1, $speed = $$value));
    	validate_store(forward, 'forward');
    	component_subscribe($$self, forward, $$value => $$invalidate(2, $forward = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SetPointBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SetPointBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		forward,
    		reverse,
    		speed,
    		reverseButton,
    		forwardButton,
    		plusButton,
    		minusButton,
    		$reverse,
    		$speed,
    		$forward
    	});

    	return [$reverse, $speed, $forward];
    }

    class SetPointBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SetPointBox",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\StatBox.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\StatBox.svelte";

    function create_fragment$3(ctx) {
    	let div12;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let t4;
    	let div5;
    	let div3;
    	let t6;
    	let div4;
    	let t7;
    	let t8;
    	let t9;
    	let div8;
    	let div6;
    	let t11;
    	let div7;
    	let t12;
    	let t13;
    	let t14;
    	let div11;
    	let div9;
    	let t16;
    	let div10;
    	let t17;
    	let t18;

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Current Speed";
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*$currentSpeed*/ ctx[0]);
    			t3 = text(" mph");
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Battery Voltage";
    			t6 = space();
    			div4 = element("div");
    			t7 = text(/*$voltage*/ ctx[1]);
    			t8 = text(" V");
    			t9 = space();
    			div8 = element("div");
    			div6 = element("div");
    			div6.textContent = "Current Draw";
    			t11 = space();
    			div7 = element("div");
    			t12 = text(/*$draw*/ ctx[2]);
    			t13 = text(" A");
    			t14 = space();
    			div11 = element("div");
    			div9 = element("div");
    			div9.textContent = "Sensor Distance";
    			t16 = space();
    			div10 = element("div");
    			t17 = text(/*$distance*/ ctx[3]);
    			t18 = text(" ft");
    			attr_dev(div0, "class", "stat-title");
    			add_location(div0, file$3, 7, 8, 200);
    			attr_dev(div1, "class", "stat-value");
    			add_location(div1, file$3, 8, 8, 253);
    			attr_dev(div2, "class", "stat");
    			add_location(div2, file$3, 6, 4, 172);
    			attr_dev(div3, "class", "stat-title");
    			add_location(div3, file$3, 12, 8, 350);
    			attr_dev(div4, "class", "stat-value");
    			add_location(div4, file$3, 13, 8, 405);
    			attr_dev(div5, "class", "stat");
    			add_location(div5, file$3, 11, 4, 322);
    			attr_dev(div6, "class", "stat-title");
    			add_location(div6, file$3, 17, 8, 495);
    			attr_dev(div7, "class", "stat-value");
    			add_location(div7, file$3, 18, 8, 547);
    			attr_dev(div8, "class", "stat");
    			add_location(div8, file$3, 16, 4, 467);
    			attr_dev(div9, "class", "stat-title");
    			add_location(div9, file$3, 22, 8, 634);
    			attr_dev(div10, "class", "stat-value");
    			add_location(div10, file$3, 23, 8, 689);
    			attr_dev(div11, "class", "stat");
    			add_location(div11, file$3, 21, 4, 606);
    			attr_dev(div12, "class", "stats stats-vertical lg:stats-horizontal shadow font-black");
    			add_location(div12, file$3, 4, 0, 92);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div12, t4);
    			append_dev(div12, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, t7);
    			append_dev(div4, t8);
    			append_dev(div12, t9);
    			append_dev(div12, div8);
    			append_dev(div8, div6);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			append_dev(div7, t12);
    			append_dev(div7, t13);
    			append_dev(div12, t14);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			append_dev(div11, t16);
    			append_dev(div11, div10);
    			append_dev(div10, t17);
    			append_dev(div10, t18);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentSpeed*/ 1) set_data_dev(t2, /*$currentSpeed*/ ctx[0]);
    			if (dirty & /*$voltage*/ 2) set_data_dev(t7, /*$voltage*/ ctx[1]);
    			if (dirty & /*$draw*/ 4) set_data_dev(t12, /*$draw*/ ctx[2]);
    			if (dirty & /*$distance*/ 8) set_data_dev(t17, /*$distance*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $currentSpeed;
    	let $voltage;
    	let $draw;
    	let $distance;
    	validate_store(currentSpeed, 'currentSpeed');
    	component_subscribe($$self, currentSpeed, $$value => $$invalidate(0, $currentSpeed = $$value));
    	validate_store(voltage, 'voltage');
    	component_subscribe($$self, voltage, $$value => $$invalidate(1, $voltage = $$value));
    	validate_store(draw, 'draw');
    	component_subscribe($$self, draw, $$value => $$invalidate(2, $draw = $$value));
    	validate_store(distance, 'distance');
    	component_subscribe($$self, distance, $$value => $$invalidate(3, $distance = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StatBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StatBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		currentSpeed,
    		distance,
    		draw,
    		voltage,
    		$currentSpeed,
    		$voltage,
    		$draw,
    		$distance
    	});

    	return [$currentSpeed, $voltage, $draw, $distance];
    }

    class StatBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatBox",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\DiagnosticsBox.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\DiagnosticsBox.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (10:4) {#each $diagnostics as diagnostic}
    function create_each_block(ctx) {
    	let li;
    	let t_value = /*diagnostic*/ ctx[1] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "text-error");
    			add_location(li, file$2, 10, 8, 306);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$diagnostics*/ 1 && t_value !== (t_value = /*diagnostic*/ ctx[1] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:4) {#each $diagnostics as diagnostic}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let svg;
    	let rect;
    	let t;
    	let div;
    	let each_value = /*$diagnostics*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			t = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(rect, "width", "600");
    			attr_dev(rect, "height", "330");
    			set_style(rect, "fill", "none");
    			set_style(rect, "stroke-width", "10");
    			set_style(rect, "stroke", "dodgerblue");
    			add_location(rect, file$2, 5, 4, 112);
    			attr_dev(svg, "width", "600");
    			attr_dev(svg, "height", "330");
    			attr_dev(svg, "class", "fixed");
    			add_location(svg, file$2, 4, 0, 66);
    			attr_dev(div, "class", "ml-[20px] mt-[20px] font-bold text-2xl");
    			add_location(div, file$2, 8, 0, 204);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$diagnostics*/ 1) {
    				each_value = /*$diagnostics*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $diagnostics;
    	validate_store(diagnostics, 'diagnostics');
    	component_subscribe($$self, diagnostics, $$value => $$invalidate(0, $diagnostics = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DiagnosticsBox', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DiagnosticsBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ diagnostics, $diagnostics });
    	return [$diagnostics];
    }

    class DiagnosticsBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DiagnosticsBox",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Overrides.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\Overrides.svelte";

    function create_fragment$1(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Override Sensors";
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			attr_dev(div0, "class", "text-4xl font-bold text-primary fixed");
    			add_location(div0, file$1, 7, 0, 116);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "toggle toggle-primary toggle-lg");
    			add_location(input, file$1, 12, 0, 243);
    			attr_dev(div1, "class", "ml-[120px] mt-[55px] fixed");
    			add_location(div1, file$1, 11, 0, 201);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			input.checked = /*$overrideSensors*/ ctx[0];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$overrideSensors*/ 1) {
    				input.checked = /*$overrideSensors*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $overrideSensors;
    	validate_store(overrideSensors, 'overrideSensors');
    	component_subscribe($$self, overrideSensors, $$value => $$invalidate(0, $overrideSensors = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Overrides', slots, []);
    	let overrideSensorsCheckBox = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Overrides> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		$overrideSensors = this.checked;
    		overrideSensors.set($overrideSensors);
    	}

    	$$self.$capture_state = () => ({
    		overrideSensors,
    		overrideSensorsCheckBox,
    		$overrideSensors
    	});

    	$$self.$inject_state = $$props => {
    		if ('overrideSensorsCheckBox' in $$props) overrideSensorsCheckBox = $$props.overrideSensorsCheckBox;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$overrideSensors, input_change_handler];
    }

    class Overrides extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overrides",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let border;
    	let t0;
    	let div0;
    	let stopbutton0;
    	let t1;
    	let div1;
    	let stopbutton1;
    	let t2;
    	let div2;
    	let setpointbox;
    	let t3;
    	let div3;
    	let statbox;
    	let t4;
    	let div4;
    	let diagnosticsbox;
    	let t5;
    	let div5;
    	let overrides;
    	let current;
    	border = new Border({ $$inline: true });
    	stopbutton0 = new StopButton({ $$inline: true });
    	stopbutton1 = new StopButton({ $$inline: true });
    	setpointbox = new SetPointBox({ $$inline: true });
    	statbox = new StatBox({ $$inline: true });
    	diagnosticsbox = new DiagnosticsBox({ $$inline: true });
    	overrides = new Overrides({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(border.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(stopbutton0.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(stopbutton1.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(setpointbox.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			create_component(statbox.$$.fragment);
    			t4 = space();
    			div4 = element("div");
    			create_component(diagnosticsbox.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			create_component(overrides.$$.fragment);
    			attr_dev(div0, "class", "mt-[548px] fixed");
    			add_location(div0, file, 11, 0, 313);
    			attr_dev(div1, "class", "mt-[548px] ml-[978px] fixed");
    			add_location(div1, file, 15, 0, 371);
    			attr_dev(div2, "class", "mt-[50px] ml-[50px] fixed");
    			add_location(div2, file, 20, 0, 446);
    			attr_dev(div3, "class", "mt-[380px] ml-[50px] fixed");
    			add_location(div3, file, 24, 0, 517);
    			attr_dev(div4, "class", "ml-[650px] mt-[30px] fixed");
    			add_location(div4, file, 28, 0, 585);
    			attr_dev(div5, "class", "ml-[500px] mt-[600px] fixed");
    			add_location(div5, file, 32, 0, 657);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(border, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(stopbutton0, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(stopbutton1, div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(setpointbox, div2, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(statbox, div3, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div4, anchor);
    			mount_component(diagnosticsbox, div4, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			mount_component(overrides, div5, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(border.$$.fragment, local);
    			transition_in(stopbutton0.$$.fragment, local);
    			transition_in(stopbutton1.$$.fragment, local);
    			transition_in(setpointbox.$$.fragment, local);
    			transition_in(statbox.$$.fragment, local);
    			transition_in(diagnosticsbox.$$.fragment, local);
    			transition_in(overrides.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(border.$$.fragment, local);
    			transition_out(stopbutton0.$$.fragment, local);
    			transition_out(stopbutton1.$$.fragment, local);
    			transition_out(setpointbox.$$.fragment, local);
    			transition_out(statbox.$$.fragment, local);
    			transition_out(diagnosticsbox.$$.fragment, local);
    			transition_out(overrides.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(border, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_component(stopbutton0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(stopbutton1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			destroy_component(setpointbox);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_component(statbox);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div4);
    			destroy_component(diagnosticsbox);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			destroy_component(overrides);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		StopButton,
    		Border,
    		SetPointBox,
    		StatBox,
    		DiagnosticsBox,
    		Overrides
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "/*\n! tailwindcss v3.1.4 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 229 96% 64%;\n  --pf: 229 96% 51%;\n  --sf: 215 26% 47%;\n  --af: 154 49% 48%;\n  --nf: 233 27% 10%;\n  --b2: 0 0% 90%;\n  --b3: 0 0% 81%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --pc: 229 100% 93%;\n  --sc: 215 100% 12%;\n  --ac: 154 100% 12%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --btn-text-case: uppercase;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 215 26% 59%;\n  --a: 154 49% 60%;\n  --n: 233 27% 13%;\n  --nc: 210 38% 95%;\n  --b1: 0 0% 100%;\n  --bc: 233 27% 13%;\n  --rounded-box: 0.25rem;\n  --rounded-btn: .125rem;\n  --rounded-badge: .125rem;\n  --animation-btn: 0;\n  --animation-input: 0;\n  --btn-focus-scale: 1;\n}\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::-webkit-backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\r\n.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  -webkit-text-decoration-line: none;\n  text-decoration-line: none;\n  border-width: var(--border-btn, 1px);\n  -webkit-animation: button-pop var(--animation-btn, 0.25s) ease-out;\n          animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn[disabled] {\n  pointer-events: none;\n}\r\n.btn-square {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn.loading, \n    .btn.loading:hover {\n  pointer-events: none;\n}\r\n.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  -webkit-animation: spin 2s linear infinite;\n          animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}\r\n@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    -webkit-animation: spin 10s linear infinite;\n            animation: spin 10s linear infinite;\n  }\n}\r\n@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\r\n.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}\r\n.checkbox {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.input {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.input-group > *, \n  .input-group > .input {\n  border-radius: 0px;\n}\r\n.stats {\n  display: inline-grid;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  border-radius: var(--rounded-box, 1rem);\n}\r\n:where(.stats) {\n  grid-auto-flow: column;\n  overflow-x: auto;\n}\r\n.stat {\n  display: inline-grid;\n  width: 100%;\n  grid-template-columns: repeat(1, 1fr);\n  -moz-column-gap: 1rem;\n       column-gap: 1rem;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.1;\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n  padding-top: 1rem;\n  padding-bottom: 1rem;\n}\r\n.stat-title {\n  grid-column-start: 1;\n  white-space: nowrap;\n  opacity: 0.6;\n}\r\n.stat-value {\n  grid-column-start: 1;\n  white-space: nowrap;\n  font-size: 2.25rem;\n  line-height: 2.5rem;\n  font-weight: 800;\n}\r\n.stat-desc {\n  grid-column-start: 1;\n  white-space: nowrap;\n  font-size: 0.75rem;\n  line-height: 1rem;\n  opacity: 0.6;\n}\r\n.toggle {\n  flex-shrink: 0;\n  --chkbg: hsla(var(--bc) / 0.2);\n  --handleoffset: 1.5rem;\n  height: 1.5rem;\n  width: 3rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  transition-duration: 300ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-badge, 1.9rem);\n  transition: background, box-shadow var(--animation-input, 0.2s) ease-in-out;\n  box-shadow: calc(var(--handleoffset) * -1) 0 0 2px hsl(var(--b1)) inset, 0 0 0 2px hsl(var(--b1)) inset;\n}\r\n.btn-outline .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  background-color: transparent;\n}\r\n.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--ac) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn:active:hover,\n  .btn:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}\r\n.btn:hover, \n    .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}\r\n.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\r\n.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-primary:hover, \n    .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}\r\n.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-secondary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-secondary:hover, \n    .btn-secondary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n}\r\n.btn-secondary:focus-visible {\n  outline: 2px solid hsl(var(--s));\n}\r\n.btn-success {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--suc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-success:hover, \n    .btn-success.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n}\r\n.btn-success:focus-visible {\n  outline: 2px solid hsl(var(--su));\n}\r\n.btn-error {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-error:hover, \n    .btn-error.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n}\r\n.btn-error:focus-visible {\n  outline: 2px solid hsl(var(--er));\n}\r\n.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}\r\n.btn.glass:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}\r\n.btn-outline {\n  border-color: currentColor;\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--b1) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent {\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--af, var(--a)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success {\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--suc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info {\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--in) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--inc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning {\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error {\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn-disabled:hover, \n  .btn[disabled], \n  .btn[disabled]:hover {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btn.loading.btn-square:before, \n    .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}\r\n.btn.loading.btn-xl:before, \n    .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}\r\n.btn.loading.btn-sm:before, \n    .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn, \n  .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:first-of-type) {\n  margin-left: -1px;\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:last-of-type) {\n  border-top-right-radius: 0px;\n  border-bottom-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:first-of-type) {\n  margin-top: -1px;\n  border-top-left-radius: 0px;\n  border-top-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:last-of-type) {\n  border-bottom-right-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n.checkbox:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.checkbox:checked, \n  .checkbox[checked=\"true\"] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(-45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.checkbox:indeterminate {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(-90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(0deg, hsl(var(--chkbg)) 43%, hsl(var(--chkfg)) 43%, hsl(var(--chkfg)) 57%, hsl(var(--chkbg)) 57%);\n}\r\n.checkbox:disabled {\n  cursor: not-allowed;\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  opacity: 0.2;\n}\r\n@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\nbody[dir=\"rtl\"] .checkbox {\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n}\r\nbody[dir=\"rtl\"] .checkbox:checked,\n    body[dir=\"rtl\"] .checkbox[checked=\"true\"] {\n  background-image: linear-gradient(45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(-45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-secondary {\n  outline: 2px solid hsl(var(--s));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-success {\n  outline: 2px solid hsl(var(--su));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-error {\n  outline: 2px solid hsl(var(--er));\n}\r\n.input[list]::-webkit-calendar-picker-indicator {\n  line-height: 1em;\n}\r\n.input:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.input-disabled, \n  .input[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.input-disabled::-moz-placeholder, .input[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.input-disabled::placeholder, \n  .input[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n:where(.stats) > :not([hidden]) ~ :not([hidden]) {\n  --tw-divide-x-reverse: 0;\n  border-right-width: calc(1px * var(--tw-divide-x-reverse));\n  border-left-width: calc(1px * calc(1 - var(--tw-divide-x-reverse)));\n  --tw-divide-y-reverse: 0;\n  border-top-width: calc(0px * calc(1 - var(--tw-divide-y-reverse)));\n  border-bottom-width: calc(0px * var(--tw-divide-y-reverse));\n}\r\n.toggle:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.toggle:checked,\n  .toggle[checked=\"true\"] {\n  --chkbg: hsl(var(--bc));\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  box-shadow: var(--handleoffset) 0 0 2px hsl(var(--b1)) inset, 0 0 0 2px hsl(var(--b1)) inset;\n}\r\n[dir=\"rtl\"] .toggle:checked, [dir=\"rtl\"] .toggle[checked=\"true\"] {\n  box-shadow: calc(var(--handleoffset) * 1) 0 0 2px hsl(var(--b1)) inset, 0 0 0 2px hsl(var(--b1)) inset;\n}\r\n.toggle:indeterminate {\n  --chkbg: hsl(var(--bc));\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  box-shadow: calc(var(--handleoffset) / 2) 0 0 2px hsl(var(--b1)) inset, calc(var(--handleoffset) / -2) 0 0 2px hsl(var(--b1)) inset, 0 0 0 2px hsl(var(--b1)) inset;\n}\r\n[dir=\"rtl\"] .toggle:indeterminate {\n  box-shadow: calc(var(--handleoffset) / 2) 0 0 2px hsl(var(--b1)) inset, calc(var(--handleoffset) / -2) 0 0 2px hsl(var(--b1)) inset, 0 0 0 2px hsl(var(--b1)) inset;\n}\r\n.toggle-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.toggle-primary:checked,\n    .toggle-primary[checked=\"true\"] {\n  --chkbg: hsl(var(--p));\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.toggle-secondary:focus-visible {\n  outline: 2px solid hsl(var(--s));\n}\r\n.toggle-secondary:checked,\n    .toggle-secondary[checked=\"true\"] {\n  --chkbg: hsl(var(--s));\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.toggle:disabled {\n  cursor: not-allowed;\n  border-color: transparent;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n}\r\n.btn-lg {\n  height: 4rem;\n  padding-left: 1.5rem;\n  padding-right: 1.5rem;\n  min-height: 4rem;\n  font-size: 1.125rem;\n}\r\n.btn-square:where(.btn-xs) {\n  height: 1.5rem;\n  width: 1.5rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-sm) {\n  height: 2rem;\n  width: 2rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-lg) {\n  height: 4rem;\n  width: 4rem;\n  padding: 0px;\n}\r\n.btn-circle:where(.btn-lg) {\n  height: 4rem;\n  width: 4rem;\n  border-radius: 9999px;\n  padding: 0px;\n}\r\n.stats-vertical {\n  grid-auto-flow: row;\n}\r\n.toggle-lg {\n  --handleoffset: 2rem;\n  height: 2rem;\n  width: 4rem;\n}\r\n.stats-vertical > :not([hidden]) ~ :not([hidden]) {\n  --tw-divide-y-reverse: 0;\n  border-top-width: calc(1px * calc(1 - var(--tw-divide-y-reverse)));\n  border-bottom-width: calc(1px * var(--tw-divide-y-reverse));\n  --tw-divide-x-reverse: 0;\n  border-right-width: calc(0px * var(--tw-divide-x-reverse));\n  border-left-width: calc(0px * calc(1 - var(--tw-divide-x-reverse)));\n}\r\n.stats-vertical {\n  overflow-y: auto;\n}\r\n.fixed {\n  position: fixed;\n}\r\n.mt-\\[700px\\] {\n  margin-top: 700px;\n}\r\n.mt-\\[600px\\] {\n  margin-top: 600px;\n}\r\n.mt-\\[800px\\] {\n  margin-top: 800px;\n}\r\n.mt-\\[500px\\] {\n  margin-top: 500px;\n}\r\n.mt-\\[520px\\] {\n  margin-top: 520px;\n}\r\n.mt-\\[560px\\] {\n  margin-top: 560px;\n}\r\n.mt-\\[550px\\] {\n  margin-top: 550px;\n}\r\n.mt-\\[540px\\] {\n  margin-top: 540px;\n}\r\n.mt-\\[545px\\] {\n  margin-top: 545px;\n}\r\n.mt-\\[548px\\] {\n  margin-top: 548px;\n}\r\n.ml-\\[800px\\] {\n  margin-left: 800px;\n}\r\n.ml-\\[900px\\] {\n  margin-left: 900px;\n}\r\n.ml-\\[1100px\\] {\n  margin-left: 1100px;\n}\r\n.ml-\\[1000px\\] {\n  margin-left: 1000px;\n}\r\n.ml-\\[980px\\] {\n  margin-left: 980px;\n}\r\n.ml-\\[975px\\] {\n  margin-left: 975px;\n}\r\n.ml-\\[978px\\] {\n  margin-left: 978px;\n}\r\n.mt-\\[200px\\] {\n  margin-top: 200px;\n}\r\n.ml-\\[200px\\] {\n  margin-left: 200px;\n}\r\n.mt-\\[75px\\] {\n  margin-top: 75px;\n}\r\n.ml-\\[75px\\] {\n  margin-left: 75px;\n}\r\n.mt-\\[50px\\] {\n  margin-top: 50px;\n}\r\n.ml-\\[50px\\] {\n  margin-left: 50px;\n}\r\n.mt-\\[100px\\] {\n  margin-top: 100px;\n}\r\n.ml-\\[30px\\] {\n  margin-left: 30px;\n}\r\n.mt-\\[125px\\] {\n  margin-top: 125px;\n}\r\n.mt-\\[80px\\] {\n  margin-top: 80px;\n}\r\n.ml-\\[130px\\] {\n  margin-left: 130px;\n}\r\n.ml-\\[230px\\] {\n  margin-left: 230px;\n}\r\n.ml-\\[290px\\] {\n  margin-left: 290px;\n}\r\n.ml-\\[310px\\] {\n  margin-left: 310px;\n}\r\n.ml-\\[325px\\] {\n  margin-left: 325px;\n}\r\n.ml-\\[330px\\] {\n  margin-left: 330px;\n}\r\n.mt-\\[140px\\] {\n  margin-top: 140px;\n}\r\n.mt-\\[250px\\] {\n  margin-top: 250px;\n}\r\n.mt-\\[220px\\] {\n  margin-top: 220px;\n}\r\n.ml-\\[70px\\] {\n  margin-left: 70px;\n}\r\n.ml-\\[220px\\] {\n  margin-left: 220px;\n}\r\n.ml-\\[280px\\] {\n  margin-left: 280px;\n}\r\n.ml-\\[300px\\] {\n  margin-left: 300px;\n}\r\n.mt-\\[450px\\] {\n  margin-top: 450px;\n}\r\n.mt-\\[400px\\] {\n  margin-top: 400px;\n}\r\n.mt-\\[360px\\] {\n  margin-top: 360px;\n}\r\n.mt-\\[380px\\] {\n  margin-top: 380px;\n}\r\n.ml-\\[500px\\] {\n  margin-left: 500px;\n}\r\n.mr-\\[380px\\] {\n  margin-right: 380px;\n}\r\n.ml-\\[680px\\] {\n  margin-left: 680px;\n}\r\n.ml-\\[650px\\] {\n  margin-left: 650px;\n}\r\n.mt-\\[30px\\] {\n  margin-top: 30px;\n}\r\n.ml-\\[20px\\] {\n  margin-left: 20px;\n}\r\n.mt-\\[20px\\] {\n  margin-top: 20px;\n}\r\n.mt-\\[70px\\] {\n  margin-top: 70px;\n}\r\n.ml-\\[210px\\] {\n  margin-left: 210px;\n}\r\n.ml-\\[205px\\] {\n  margin-left: 205px;\n}\r\n.ml-\\[208px\\] {\n  margin-left: 208px;\n}\r\n.ml-\\[206px\\] {\n  margin-left: 206px;\n}\r\n.ml-\\[203px\\] {\n  margin-left: 203px;\n}\r\n.ml-\\[600px\\] {\n  margin-left: 600px;\n}\r\n.ml-\\[550px\\] {\n  margin-left: 550px;\n}\r\n.ml-\\[525px\\] {\n  margin-left: 525px;\n}\r\n.ml-\\[575px\\] {\n  margin-left: 575px;\n}\r\n.ml-\\[530px\\] {\n  margin-left: 530px;\n}\r\n.ml-\\[25px\\] {\n  margin-left: 25px;\n}\r\n.mt-\\[40px\\] {\n  margin-top: 40px;\n}\r\n.ml-\\[60px\\] {\n  margin-left: 60px;\n}\r\n.mt-\\[55px\\] {\n  margin-top: 55px;\n}\r\n.ml-\\[90px\\] {\n  margin-left: 90px;\n}\r\n.ml-\\[100px\\] {\n  margin-left: 100px;\n}\r\n.ml-\\[120px\\] {\n  margin-left: 120px;\n}\r\n.h-\\[280px\\] {\n  height: 280px;\n}\r\n.h-\\[200px\\] {\n  height: 200px;\n}\r\n.h-\\[250px\\] {\n  height: 250px;\n}\r\n.h-\\[400px\\] {\n  height: 400px;\n}\r\n.h-\\[100px\\] {\n  height: 100px;\n}\r\n.h-\\[125px\\] {\n  height: 125px;\n}\r\n.h-6 {\n  height: 1.5rem;\n}\r\n.h-12 {\n  height: 3rem;\n}\r\n.h-20 {\n  height: 5rem;\n}\r\n.h-\\[40px\\] {\n  height: 40px;\n}\r\n.h-\\[65px\\] {\n  height: 65px;\n}\r\n.w-96 {\n  width: 24rem;\n}\r\n.w-\\[300px\\] {\n  width: 300px;\n}\r\n.w-\\[280px\\] {\n  width: 280px;\n}\r\n.w-\\[250px\\] {\n  width: 250px;\n}\r\n.w-\\[200px\\] {\n  width: 200px;\n}\r\n.w-\\[100px\\] {\n  width: 100px;\n}\r\n.w-\\[150px\\] {\n  width: 150px;\n}\r\n.w-\\[125px\\] {\n  width: 125px;\n}\r\n.w-6 {\n  width: 1.5rem;\n}\r\n.w-12 {\n  width: 3rem;\n}\r\n.w-20 {\n  width: 5rem;\n}\r\n.border-8 {\n  border-width: 8px;\n}\r\n.border-4 {\n  border-width: 4px;\n}\r\n.text-xl {\n  font-size: 1.25rem;\n  line-height: 1.75rem;\n}\r\n.text-5xl {\n  font-size: 3rem;\n  line-height: 1;\n}\r\n.text-6xl {\n  font-size: 3.75rem;\n  line-height: 1;\n}\r\n.text-4xl {\n  font-size: 2.25rem;\n  line-height: 2.5rem;\n}\r\n.text-lg {\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n}\r\n.text-2xl {\n  font-size: 1.5rem;\n  line-height: 2rem;\n}\r\n.text-xs {\n  font-size: 0.75rem;\n  line-height: 1rem;\n}\r\n.text-3xl {\n  font-size: 1.875rem;\n  line-height: 2.25rem;\n}\r\n.text-7xl {\n  font-size: 4.5rem;\n  line-height: 1;\n}\r\n.font-bold {\n  font-weight: 700;\n}\r\n.font-black {\n  font-weight: 900;\n}\r\n.text-white {\n  --tw-text-opacity: 1;\n  color: rgb(255 255 255 / var(--tw-text-opacity));\n}\r\n.text-black {\n  --tw-text-opacity: 1;\n  color: rgb(0 0 0 / var(--tw-text-opacity));\n}\r\n.text-sky-300 {\n  --tw-text-opacity: 1;\n  color: rgb(125 211 252 / var(--tw-text-opacity));\n}\r\n.text-red-300 {\n  --tw-text-opacity: 1;\n  color: rgb(252 165 165 / var(--tw-text-opacity));\n}\r\n.text-red-100 {\n  --tw-text-opacity: 1;\n  color: rgb(254 226 226 / var(--tw-text-opacity));\n}\r\n.text-rose-700 {\n  --tw-text-opacity: 1;\n  color: rgb(190 18 60 / var(--tw-text-opacity));\n}\r\n.text-error {\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.text-blue-500 {\n  --tw-text-opacity: 1;\n  color: rgb(59 130 246 / var(--tw-text-opacity));\n}\r\n.text-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.shadow {\n  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\r\n/*My hatred for CSS is present in the emptiness of this file*/\r\n@media (min-width: 1024px) {\n\n  .lg\\:stats-horizontal {\n    grid-auto-flow: column;\n  }\n\n  .lg\\:stats-horizontal > :not([hidden]) ~ :not([hidden]) {\n    --tw-divide-x-reverse: 0;\n    border-right-width: calc(1px * var(--tw-divide-x-reverse));\n    border-left-width: calc(1px * calc(1 - var(--tw-divide-x-reverse)));\n    --tw-divide-y-reverse: 0;\n    border-top-width: calc(0px * calc(1 - var(--tw-divide-y-reverse)));\n    border-bottom-width: calc(0px * var(--tw-divide-y-reverse));\n  }\n\n  .lg\\:stats-horizontal {\n    overflow-x: auto;\n  }\n}\r\n\r\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
