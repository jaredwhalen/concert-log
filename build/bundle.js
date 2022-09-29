
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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

    var project = {
    	name: "concert-tracker",
    	slug: "concert-tracker"
    };
    var s3 = {
    	bucket: "graphics.axios.com",
    	folder: "concert-tracker"
    };
    var google = {
    	doc: [
    		{
    			id: "",
    			filepath: "src/data/copy.json"
    		}
    	],
    	sheet: [
    		{
    			id: "",
    			gid: "",
    			filepath: ""
    		}
    	]
    };
    var files = [
    ];
    var isFullbleed = false;
    var appleFallback = "<%= meta.appleFallback %>";
    var newsletterFallback = "<%= meta.newsletterFallback %>";
    var embedVersion = "1.0";
    var projectConfig = {
    	project: project,
    	s3: s3,
    	google: google,
    	files: files,
    	isFullbleed: isFullbleed,
    	appleFallback: appleFallback,
    	newsletterFallback: newsletterFallback,
    	embedVersion: embedVersion
    };

    /* src/Meta.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/Meta.svelte";

    function create_fragment$4(ctx) {
    	let meta0;
    	let meta1;
    	let meta2;
    	let meta3;
    	let meta4;
    	let link;
    	let meta5;
    	let meta6;
    	let title_value;
    	document.title = title_value = projectConfig.project.name;

    	const block = {
    		c: function create() {
    			meta0 = element("meta");
    			meta1 = element("meta");
    			meta2 = element("meta");
    			meta3 = element("meta");
    			meta4 = element("meta");
    			link = element("link");
    			meta5 = element("meta");
    			meta6 = element("meta");
    			attr_dev(meta0, "charset", "utf-8");
    			add_location(meta0, file$4, 5, 2, 90);
    			attr_dev(meta1, "http-equiv", "X-UA-Compatible");
    			attr_dev(meta1, "content", "IE=edge");
    			add_location(meta1, file$4, 6, 2, 117);
    			attr_dev(meta2, "name", "viewport");
    			attr_dev(meta2, "content", "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no");
    			add_location(meta2, file$4, 7, 2, 175);
    			attr_dev(meta3, "property", "fullbleed");
    			attr_dev(meta3, "content", "false");
    			add_location(meta3, file$4, 11, 2, 310);
    			attr_dev(meta4, "property", "slug");
    			attr_dev(meta4, "content", projectConfig.project.slug);
    			add_location(meta4, file$4, 12, 2, 358);
    			attr_dev(link, "rel", "icon");
    			attr_dev(link, "type", "image/png");
    			attr_dev(link, "href", "https://static.axios.com/img/axiosvisuals-favicon-128x128.png");
    			attr_dev(link, "sizes", "128x128");
    			add_location(link, file$4, 13, 2, 422);
    			attr_dev(meta5, "property", "apple-fallback");
    			attr_dev(meta5, "content", `fallbacks/${projectConfig.project.slug}-apple.png`);
    			add_location(meta5, file$4, 19, 2, 564);
    			attr_dev(meta6, "property", "newsletter-fallback");
    			attr_dev(meta6, "content", `fallbacks/${projectConfig.project.slug}-fallback.png`);
    			add_location(meta6, file$4, 23, 2, 673);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta0);
    			append_dev(document.head, meta1);
    			append_dev(document.head, meta2);
    			append_dev(document.head, meta3);
    			append_dev(document.head, meta4);
    			append_dev(document.head, link);
    			append_dev(document.head, meta5);
    			append_dev(document.head, meta6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projectConfig*/ 0 && title_value !== (title_value = projectConfig.project.name)) {
    				document.title = title_value;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(meta0);
    			detach_dev(meta1);
    			detach_dev(meta2);
    			detach_dev(meta3);
    			detach_dev(meta4);
    			detach_dev(link);
    			detach_dev(meta5);
    			detach_dev(meta6);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Meta", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Meta> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ projectConfig });
    	return [];
    }

    class Meta extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Meta",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/components/Header.svelte";

    function create_fragment$3(ctx) {
    	let header;
    	let h1;
    	let t0;
    	let span;
    	let t2;
    	let div;
    	let a0;
    	let svg0;
    	let g;
    	let path0;
    	let t3;
    	let a1;
    	let svg1;
    	let path1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text("concert");
    			span = element("span");
    			span.textContent = ".log";
    			t2 = space();
    			div = element("div");
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			t3 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			attr_dev(span, "class", "svelte-angj0w");
    			add_location(span, file$3, 1, 13, 22);
    			attr_dev(h1, "class", "svelte-angj0w");
    			add_location(h1, file$3, 1, 2, 11);
    			attr_dev(path0, "d", "M-3.11,410.8c56,5,106.56-8.77,152.36-43.23-47.89-4.13-79.86-28.14-97.63-73.21,16,2.44,30.77,2.3,46.51-1.91-24.84-6.09-44.73-18.21-60-37.41S15.32,213.9,15.38,188.45c14.65,7.48,29.37,12.07,46.68,12.78-22.82-16.77-37.49-37.61-43.29-64.17C13,110.68,17,85.73,30.31,61.75q85.13,100,214.85,109.34c-.33-11.08-1.75-21.73-.76-32.15,4-42.5,26-73.13,65.46-88.78,41.28-16.37,79.22-8,112,22.16,2.48,2.28,4.55,2.9,7.83,2.12,19.82-4.68,38.77-11.52,56.54-21.53,1.43-.8,2.92-1.5,5.38-2.76-8.05,24.47-22.71,42.58-42.92,57.38,6.13-1.11,12.31-2,18.36-3.37,6.46-1.5,12.85-3.33,19.16-5.34,6.1-1.95,12.07-4.32,19.55-7-4.48,6-7.57,11.41-11.78,15.66-11.9,12-24.14,23.72-36.54,35.23-2.56,2.38-3.77,4.42-3.69,7.93,1.32,62.37-15.12,119.9-48.67,172.3C361.52,391,300.21,434.46,220.88,451,155.93,464.6,92.65,458.29,32,430.75c-12.17-5.52-23.75-12.33-35.6-18.55Z");
    			attr_dev(path0, "transform", "translate(3.64 -41.93)");
    			add_location(path0, file$3, 9, 10, 279);
    			attr_dev(g, "id", "tfnVb0.tif");
    			add_location(g, file$3, 8, 8, 249);
    			attr_dev(svg0, "id", "twitter");
    			attr_dev(svg0, "data-name", "twitter");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 509.42 416");
    			attr_dev(svg0, "class", "svelte-angj0w");
    			add_location(svg0, file$3, 7, 6, 142);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://twitter.com/jared_whalen");
    			add_location(a0, file$3, 6, 4, 76);
    			attr_dev(path1, "d", "M249.88,233.65a16.29,16.29,0,0,0-5.15,31.75c.81.15,1.11-.35,1.11-.78s0-1.41,0-2.77c-4.53,1-5.49-2.19-5.49-2.19a4.3,4.3,0,0,0-1.81-2.38c-1.48-1,.11-1,.11-1a3.41,3.41,0,0,1,2.5,1.68,3.46,3.46,0,0,0,4.74,1.35,3.54,3.54,0,0,1,1-2.18c-3.61-.41-7.42-1.8-7.42-8a6.3,6.3,0,0,1,1.68-4.37,5.82,5.82,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67a5.82,5.82,0,0,1,.16,4.31,6.26,6.26,0,0,1,1.68,4.37c0,6.26-3.81,7.64-7.44,8a3.91,3.91,0,0,1,1.11,3c0,2.18,0,3.93,0,4.47s.29.94,1.12.78a16.3,16.3,0,0,0-5.16-31.75Z");
    			attr_dev(path1, "transform", "translate(-233.59 -233.65)");
    			set_style(path1, "fill", "#dddddd");
    			set_style(path1, "fill-rule", "evenodd");
    			add_location(path1, file$3, 17, 8, 1406);
    			attr_dev(svg1, "id", "github");
    			attr_dev(svg1, "data-name", "github");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 32.58 31.77");
    			attr_dev(svg1, "class", "svelte-angj0w");
    			add_location(svg1, file$3, 16, 6, 1300);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://github.com/jaredwhalen/concert-log");
    			add_location(a1, file$3, 15, 4, 1224);
    			attr_dev(div, "class", "g-share svelte-angj0w");
    			add_location(div, file$3, 5, 2, 50);
    			attr_dev(header, "class", "svelte-angj0w");
    			add_location(header, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span);
    			append_dev(header, t2);
    			append_dev(header, div);
    			append_dev(div, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, g);
    			append_dev(g, path0);
    			append_dev(div, t3);
    			append_dev(div, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Table.svelte generated by Svelte v3.38.2 */

    const file$2 = "src/components/Table.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (10:4) {#each data as el}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*el*/ ctx[2].key + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*el*/ ctx[2].count + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(td0, "class", "key svelte-mq8ydi");
    			add_location(td0, file$2, 11, 12, 146);
    			attr_dev(td1, "class", "count svelte-mq8ydi");
    			add_location(td1, file$2, 12, 12, 188);
    			add_location(tr, file$2, 10, 10, 129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2 && t0_value !== (t0_value = /*el*/ ctx[2].key + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 2 && t2_value !== (t2_value = /*el*/ ctx[2].count + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(10:4) {#each data as el}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h4;
    	let t0;
    	let t1;
    	let table;
    	let tbody;
    	let each_value = /*data*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			table = element("table");
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h4, "class", "svelte-mq8ydi");
    			add_location(h4, file$2, 6, 0, 62);
    			add_location(tbody, file$2, 8, 2, 88);
    			attr_dev(table, "class", "svelte-mq8ydi");
    			add_location(table, file$2, 7, 0, 78);
    			add_location(div, file$2, 5, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    			append_dev(h4, t0);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);

    			if (dirty & /*data*/ 2) {
    				each_value = /*data*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, []);
    	let { name } = $$props;
    	let { data } = $$props;
    	const writable_props = ["name", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ name, data });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, data];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { name: 0, data: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Table> was created without expected prop 'name'");
    		}

    		if (/*data*/ ctx[1] === undefined && !("data" in props)) {
    			console.warn("<Table> was created without expected prop 'data'");
    		}
    	}

    	get name() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function groupBy(xs, key) {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    }

    /* src/components/Intro.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1$1, console: console_1 } = globals;
    const file$1 = "src/components/Intro.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let p0;
    	let span1;
    	let em0;
    	let t2;
    	let span0;
    	let em1;
    	let t3_value = /*groupedConcerts*/ ctx[0].length + "";
    	let t3;
    	let t4;
    	let t5;
    	let br0;
    	let t6;
    	let p1;
    	let t8;
    	let p2;
    	let t10;
    	let br1;
    	let t11;
    	let p3;
    	let t12;
    	let a;
    	let t14;
    	let br2;
    	let t15;
    	let p4;
    	let span2;
    	let t16;
    	let em2;
    	let t18;
    	let t19;
    	let span3;
    	let t20;
    	let em3;
    	let t22;
    	let t23;
    	let div1;
    	let table0;
    	let t24;
    	let table1;
    	let current;

    	table0 = new Table({
    			props: {
    				name: "Bands, by frequency",
    				data: /*bands*/ ctx[2]
    			},
    			$$inline: true
    		});

    	table1 = new Table({
    			props: {
    				name: "Venues, by frequency",
    				data: /*venues*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			span1 = element("span");
    			em0 = element("em");
    			em0.textContent = `${/*unique*/ ctx[1].length} different bands`;
    			t2 = text(" @ ");
    			span0 = element("span");
    			em1 = element("em");
    			t3 = text(t3_value);
    			t4 = text(" shows");
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "An incomplete list of shows I've been to. Omissions by error or embarrassment.";
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "Local/DIY shows currently not included for sanity reasons.";
    			t10 = space();
    			br1 = element("br");
    			t11 = space();
    			p3 = element("p");
    			t12 = text("A data visualization by ");
    			a = element("a");
    			a.textContent = "Jared Whalen";
    			t14 = space();
    			br2 = element("br");
    			t15 = space();
    			p4 = element("p");
    			span2 = element("span");
    			t16 = text(" 📄");
    			em2 = element("em");
    			em2.textContent = "Setlist";
    			t18 = text(" ");
    			t19 = space();
    			span3 = element("span");
    			t20 = text(" 📷");
    			em3 = element("em");
    			em3.textContent = "Photos/video";
    			t22 = text(" ");
    			t23 = space();
    			div1 = element("div");
    			create_component(table0.$$.fragment);
    			t24 = space();
    			create_component(table1.$$.fragment);
    			attr_dev(em0, "class", "svelte-71oe39");
    			add_location(em0, file$1, 49, 13, 1071);
    			attr_dev(em1, "class", "svelte-71oe39");
    			add_location(em1, file$1, 49, 62, 1120);
    			attr_dev(span0, "class", "svelte-71oe39");
    			add_location(span0, file$1, 49, 56, 1114);
    			attr_dev(span1, "class", "svelte-71oe39");
    			add_location(span1, file$1, 49, 7, 1065);
    			add_location(p0, file$1, 49, 4, 1062);
    			add_location(br0, file$1, 50, 4, 1182);
    			add_location(p1, file$1, 51, 4, 1192);
    			add_location(p2, file$1, 52, 4, 1282);
    			add_location(br1, file$1, 54, 4, 1353);
    			attr_dev(a, "href", "https://jaredwhalen.com");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-71oe39");
    			add_location(a, file$1, 55, 31, 1390);
    			add_location(p3, file$1, 55, 4, 1363);
    			add_location(br2, file$1, 56, 4, 1465);
    			attr_dev(em2, "class", "svelte-71oe39");
    			add_location(em2, file$1, 58, 21, 1493);
    			attr_dev(span2, "class", "svelte-71oe39");
    			add_location(span2, file$1, 58, 7, 1479);
    			attr_dev(em3, "class", "svelte-71oe39");
    			add_location(em3, file$1, 58, 66, 1538);
    			attr_dev(span3, "class", "svelte-71oe39");
    			add_location(span3, file$1, 58, 52, 1524);
    			add_location(p4, file$1, 58, 4, 1476);
    			add_location(div0, file$1, 48, 2, 1052);
    			attr_dev(div1, "class", "flex svelte-71oe39");
    			add_location(div1, file$1, 61, 2, 1590);
    			attr_dev(div2, "class", "intro svelte-71oe39");
    			add_location(div2, file$1, 46, 0, 1029);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(p0, span1);
    			append_dev(span1, em0);
    			append_dev(span1, t2);
    			append_dev(span1, span0);
    			append_dev(span0, em1);
    			append_dev(em1, t3);
    			append_dev(em1, t4);
    			append_dev(div0, t5);
    			append_dev(div0, br0);
    			append_dev(div0, t6);
    			append_dev(div0, p1);
    			append_dev(div0, t8);
    			append_dev(div0, p2);
    			append_dev(div0, t10);
    			append_dev(div0, br1);
    			append_dev(div0, t11);
    			append_dev(div0, p3);
    			append_dev(p3, t12);
    			append_dev(p3, a);
    			append_dev(div0, t14);
    			append_dev(div0, br2);
    			append_dev(div0, t15);
    			append_dev(div0, p4);
    			append_dev(p4, span2);
    			append_dev(span2, t16);
    			append_dev(span2, em2);
    			append_dev(span2, t18);
    			append_dev(p4, t19);
    			append_dev(p4, span3);
    			append_dev(span3, t20);
    			append_dev(span3, em3);
    			append_dev(span3, t22);
    			append_dev(div2, t23);
    			append_dev(div2, div1);
    			mount_component(table0, div1, null);
    			append_dev(div1, t24);
    			mount_component(table1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*groupedConcerts*/ 1) && t3_value !== (t3_value = /*groupedConcerts*/ ctx[0].length + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table0.$$.fragment, local);
    			transition_in(table1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table0.$$.fragment, local);
    			transition_out(table1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(table0);
    			destroy_component(table1);
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

    function onlyUnique(value, index, self) {
    	return self.indexOf(value) === index;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Intro", slots, []);
    	let { concerts } = $$props;
    	let { groupedConcerts } = $$props;
    	var unique = concerts.map(d => d.band).filter((value, index, self) => self.indexOf(value) === index);

    	const getCountBy = (data, key, nested) => {
    		let x;

    		if (nested) {
    			x = data.map(d => d[1][0][key]);
    		} else {
    			x = data.map(d => d[key]);
    		}

    		var occurrences = x.reduce(
    			function (obj, item) {
    				obj[item] = (obj[item] || 0) + 1;
    				return obj;
    			},
    			{}
    		);

    		let r = Object.keys(occurrences).map(d => {
    			return { key: d, count: occurrences[d] };
    		}).sort((a, b) => b.count - a.count);

    		return r;
    	};

    	let bands = getCountBy(concerts, "band", false);
    	let venues = getCountBy(groupedConcerts, "venue", true);
    	concerts.forEach(d => d.year = d.date.slice(0, 4));
    	let years = getCountBy(groupedConcerts, "year", true);
    	console.log(years);
    	const writable_props = ["concerts", "groupedConcerts"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Intro> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("concerts" in $$props) $$invalidate(4, concerts = $$props.concerts);
    		if ("groupedConcerts" in $$props) $$invalidate(0, groupedConcerts = $$props.groupedConcerts);
    	};

    	$$self.$capture_state = () => ({
    		Table,
    		groupBy,
    		concerts,
    		groupedConcerts,
    		onlyUnique,
    		unique,
    		getCountBy,
    		bands,
    		venues,
    		years
    	});

    	$$self.$inject_state = $$props => {
    		if ("concerts" in $$props) $$invalidate(4, concerts = $$props.concerts);
    		if ("groupedConcerts" in $$props) $$invalidate(0, groupedConcerts = $$props.groupedConcerts);
    		if ("unique" in $$props) $$invalidate(1, unique = $$props.unique);
    		if ("bands" in $$props) $$invalidate(2, bands = $$props.bands);
    		if ("venues" in $$props) $$invalidate(3, venues = $$props.venues);
    		if ("years" in $$props) years = $$props.years;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [groupedConcerts, unique, bands, venues, concerts];
    }

    class Intro extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { concerts: 4, groupedConcerts: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Intro",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*concerts*/ ctx[4] === undefined && !("concerts" in props)) {
    			console_1.warn("<Intro> was created without expected prop 'concerts'");
    		}

    		if (/*groupedConcerts*/ ctx[0] === undefined && !("groupedConcerts" in props)) {
    			console_1.warn("<Intro> was created without expected prop 'groupedConcerts'");
    		}
    	}

    	get concerts() {
    		throw new Error("<Intro>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set concerts(value) {
    		throw new Error("<Intro>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupedConcerts() {
    		throw new Error("<Intro>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupedConcerts(value) {
    		throw new Error("<Intro>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var concerts = [
    	{
    		date: "9/25/22",
    		band: "La Dispute",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/la-dispute/2022/the-theatre-of-living-arts-philadelphia-pa-63b1a6fb.html",
    		"note\r": 0
    	},
    	{
    		date: "9/25/22",
    		band: "Sweet Pill",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/25/22",
    		band: "Pictoria Vark",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/27/22",
    		band: "Snowing",
    		venue: "The Ukie Club",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/snowing/2022/ukie-club-philadelphia-pa-2bb3487a.html",
    		"note\r": 0
    	},
    	{
    		date: "8/27/22",
    		band: "Oolong",
    		venue: "The Ukie Club",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/oolong/2022/ukie-club-philadelphia-pa-2bb3487e.html",
    		"note\r": 0
    	},
    	{
    		date: "8/27/22",
    		band: "Short Fictions",
    		venue: "The Ukie Club",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/27/22",
    		band: "Ugli",
    		venue: "The Ukie Club",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/27/22",
    		band: "Lisa",
    		venue: "The Ukie Club",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/20/22",
    		band: "mewithoutYou",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2022/the-fillmore-philadelphia-philadelphia-pa-6bb33af6.html",
    		"note\r": 0
    	},
    	{
    		date: "8/20/22",
    		band: "The Messthetics",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/20/22",
    		band: "David Eugene Edwards",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/19/22",
    		band: "mewithoutYou",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2022/the-fillmore-philadelphia-philadelphia-pa-23b3c037.html",
    		"note\r": 0
    	},
    	{
    		date: "8/19/22",
    		band: "Kevin Devine & The Goddamn Band",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/kevin-devine/2022/the-fillmore-philadelphia-philadelphia-pa-3b3219f.html",
    		"note\r": 0
    	},
    	{
    		date: "8/19/22",
    		band: "David Eugene Edwards",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/14/22",
    		band: "Joyce Manor",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/joyce-manor/2022/union-transfer-philadelphia-pa-63b3e6c7.html",
    		"note\r": 0
    	},
    	{
    		date: "8/14/22",
    		band: "Citizen",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/citizen/2022/union-transfer-philadelphia-pa-73b3e6c5.html",
    		"note\r": 0
    	},
    	{
    		date: "8/14/22",
    		band: "Oso Oso",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/14/22",
    		band: "Phony",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/11/22",
    		band: "Sincere Engineer",
    		venue: "PhilaMOCA",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/sincere-engineer/2022/philamoca-philadelphia-pa-7bb3f66c.html",
    		"note\r": 0
    	},
    	{
    		date: "8/11/22",
    		band: "Covey",
    		venue: "PhilaMOCA",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/6/22",
    		band: "mewithoutYou",
    		venue: "Paradise Rock Club",
    		public_url: "https://www.dropbox.com/sh/4ubnun5llacy9zl/AAAwbzILOHXymlMO3UkfLCZHa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2022/paradise-rock-club-boston-ma-73b24ee5.html",
    		"note\r": 0
    	},
    	{
    		date: "8/6/22",
    		band: "WHY?",
    		venue: "Paradise Rock Club",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/5/22",
    		band: "mewithoutYou",
    		venue: "Irving Plaza",
    		public_url: "https://www.dropbox.com/sh/8whixywlgyj3091/AABi_xnNjGNYk5qjXkj3yLD9a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2022/irving-plaza-new-york-ny-13b25571.html",
    		"note\r": 0
    	},
    	{
    		date: "8/5/22",
    		band: "WHY?",
    		venue: "Irving Plaza",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/4/22",
    		band: "mewithoutYou",
    		venue: "Warsaw",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2022/warsaw-brooklyn-ny-4bb26346.html",
    		"note\r": 0
    	},
    	{
    		date: "8/4/22",
    		band: "WHY?",
    		venue: "Warsaw",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "7/6/22",
    		band: "RUNA",
    		venue: "Pastorius Park",
    		public_url: "https://www.dropbox.com/sh/ofq8uz2ul5zxzlu/AABf5OdFGnZI91rKGqCAR7qZa?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/14/22",
    		band: "The Menzingers",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/43n969c0oqn03v0/AACjTutvOgcPKS3oZJZHc_2wa?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/14/22",
    		band: "Oso Oso",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/akl6m2pm8sd53nr/AAAG2ExeG0aZyzwviPvO2_1Da?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/14/22",
    		band: "Sincere Engineer",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/vvkldiq09ylc175/AAA_TEJJOqJRumYqv5TupNOra?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/6/22",
    		band: "PUP",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/gikkj39eeblbugd/AAAiu180F-JQQ66jRzr7_EIEa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/pup/2022/franklin-music-hall-philadelphia-pa-4bb7f3ee.html",
    		"note\r": 0
    	},
    	{
    		date: "5/6/22",
    		band: "Sheer Mag",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/8f7rbv37rffk7k7/AADNx1TXVOEAItnrm7x30A4ba?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/6/22",
    		band: "Pinkshift",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/q1zw25t6c2abqrh/AADj1oWiX6sKH0Sa3UQ5ShK1a?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/24/22",
    		band: "Pedro the Lion",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/pedro-the-lion/2022/union-transfer-philadelphia-pa-73b60295.html",
    		"note\r": 0
    	},
    	{
    		date: "4/24/22",
    		band: "Oceanator",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/oceanator/2022/union-transfer-philadelphia-pa-5bb6677c.html",
    		"note\r": 0
    	},
    	{
    		date: "3/26/22",
    		band: "Gabrielle Cavassa",
    		venue: "SOUTH",
    		public_url: "https://www.dropbox.com/home/Apps/concert.log-media/2022-03-26/Gabrielle%20Cavassa",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/25/22",
    		band: "The Wonder Years",
    		venue: "The Fillmore",
    		public_url: "https://www.dropbox.com/sh/y1e37te458nx8g9/AACfOrjzBNFJo118bn1T0bMza?dl=0",
    		setlist: "https://www.setlist.fm/setlist/the-wonder-years/2022/the-fillmore-philadelphia-pa-1b897530.html",
    		"note\r": 0
    	},
    	{
    		date: "3/25/22",
    		band: "Spanish Love Songs",
    		venue: "The Fillmore",
    		public_url: "https://www.dropbox.com/sh/bgjfobwxw1f1nqt/AACMVAkLOiZCnB1HUGB3JQLQa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/spanish-love-songs/2022/the-fillmore-philadelphia-pa-38969f7.html",
    		"note\r": 0
    	},
    	{
    		date: "3/25/22",
    		band: "Origami Angel",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/origami-angel/2022/the-fillmore-philadelphia-pa-1b8969f0.html",
    		"note\r": 0
    	},
    	{
    		date: "3/25/22",
    		band: "Save Face",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/save-face/2022/the-fillmore-philadelphia-pa-138969f1.html",
    		"note\r": 0
    	},
    	{
    		date: "3/19/22",
    		band: "Touche Amore",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/5dmyzufsiq7ptv8/AAC85tH2gNdWM7ykD_EeBZT_a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/touche-amore/2022/union-transfer-philadelphia-pa-2389204b.html",
    		"note\r": "Anthony Green joined on encore\r"
    	},
    	{
    		date: "3/19/22",
    		band: "Vein.fm",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/6kg65zozwuh4miz/AAA0G6b__jd9rY5qgvyZXLUka?dl=0",
    		setlist: "https://www.setlist.fm/setlist/veinfm/2022/union-transfer-philadelphia-pa-4b892b0e.html",
    		"note\r": 0
    	},
    	{
    		date: "3/19/22",
    		band: "Militarie Gun",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/s6akq31mexystt8/AAArx3Ubv3sSkdooBtAOUxVQa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/militarie-gun/2022/union-transfer-philadelphia-pa-33892049.html",
    		"note\r": 0
    	},
    	{
    		date: "3/19/22",
    		band: "Closer",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/closer/2022/union-transfer-philadelphia-pa-7b8912e4.html",
    		"note\r": 0
    	},
    	{
    		date: "2/26/22",
    		band: "Illuminati Hotties",
    		venue: "First Unitarian Church",
    		public_url: "https://www.dropbox.com/sh/92g2z70bx0j7n2d/AABGqxuQEeSA11ksSYw1LY5da?dl=0",
    		setlist: "https://www.setlist.fm/setlist/illuminati-hotties/2022/first-unitarian-church-philadelphia-pa-4b89b3d6.html",
    		"note\r": 0
    	},
    	{
    		date: "2/26/22",
    		band: "Pom Pom Squad",
    		venue: "First Unitarian Church",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/7/21",
    		band: "mewithoutYou",
    		venue: "The Masquerade (Heaven)",
    		public_url: "https://www.dropbox.com/home/Apps/concert.log-media/2021-12-07/mewithoutYou",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2021/heaven-the-masquerade-atlanta-ga-38b8193.html",
    		"note\r": 0
    	},
    	{
    		date: "12/7/21",
    		band: "Dominic Angelella",
    		venue: "The Masquerade (Heaven)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/5/21",
    		band: "Hot Mulligan",
    		venue: "Theatre of Living Arts",
    		public_url: "https://www.dropbox.com/home/Apps/concert.log-media/2021-12-05/Hot%20Mulligan",
    		setlist: "https://www.setlist.fm/setlist/hot-mulligan/2021/the-theatre-of-living-arts-philadelphia-pa-138bf505.html",
    		"note\r": 0
    	},
    	{
    		date: "12/5/21",
    		band: "Prince Daddy & the Hyena",
    		venue: "Theatre of Living Arts",
    		public_url: "https://www.dropbox.com/home/Apps/concert.log-media/2021-12-05/Prince%20Daddy%20%26%20the%20Hyena",
    		setlist: "https://www.setlist.fm/setlist/prince-daddy-and-the-hyena/2021/the-theatre-of-living-arts-philadelphia-pa-1b8bf504.html",
    		"note\r": 0
    	},
    	{
    		date: "12/5/21",
    		band: "Sincere Engineer",
    		venue: "Theatre of Living Arts",
    		public_url: "https://www.dropbox.com/home/Apps/concert.log-media/2021-12-05/Sincere%20Engineer",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/5/21",
    		band: "Super American",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/28/21",
    		band: "The Menzingers",
    		venue: "Underground Arts",
    		public_url: "https://www.dropbox.com/sh/krphno41in4939l/AACZWB_1FyxqraVbMKAWsHHQa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/the-menzingers/2021/underground-arts-philadelphia-pa-2b8a442a.html",
    		"note\r": 0
    	},
    	{
    		date: "11/28/21",
    		band: "The Dirty Nil",
    		venue: "Underground Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-dirty-nil/2021/underground-arts-philadelphia-pa-238a4413.html",
    		"note\r": 0
    	},
    	{
    		date: "10/10/21",
    		band: "The Menzingers",
    		venue: "Ardmore Music Hall",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-menzingers/2021/the-ardmore-music-hall-ardmore-pa-238d3447.html",
    		"note\r": 0
    	},
    	{
    		date: "10/10/21",
    		band: "West Philadelphia Orchestra",
    		venue: "Ardmore Music Hall",
    		public_url: "https://www.dropbox.com/sh/bfkbqzq6e4frqap/AABBeS1mvQUfvcN8fQiP4I3da?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/10/21",
    		band: "Queen of Jeans",
    		venue: "Ardmore Music Hall",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/18/21",
    		band: "Hop Along",
    		venue: "Ardmore Music Hall",
    		public_url: "https://www.dropbox.com/sh/itrsd1kxf45so78/AAAxXhh-nY3oer-DICogZnN3a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/hop-along/2021/the-ardmore-music-hall-ardmore-pa-b8da98e.html",
    		"note\r": 0
    	},
    	{
    		date: "9/18/21",
    		band: "Tenci",
    		venue: "Ardmore Music Hall",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/15/21",
    		band: "mewithoutYou",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/za8sac6pfad453l/AADbbFhTGIAGNLoUWUDz_ym_a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2021/union-transfer-philadelphia-pa-4b8cbf46.html",
    		"note\r": 0
    	},
    	{
    		date: "8/15/21",
    		band: "Dominic Angelella",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/dominic-angelella/2021/union-transfer-philadelphia-pa-138cb569.html",
    		"note\r": 0
    	},
    	{
    		date: "8/14/21",
    		band: "mewithoutYou",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/em4ust4xmwqyn2z/AAAnkUrNL3RNOyAAdiV53kOxa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2021/union-transfer-philadelphia-pa-b8f45d2.html",
    		"note\r": 0
    	},
    	{
    		date: "8/14/21",
    		band: "Unwed Sailor",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/unwed-sailor/2021/union-transfer-philadelphia-pa-38cb56b.html",
    		"note\r": 0
    	},
    	{
    		date: "8/8/21",
    		band: "Japanese Breakfast",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/4sstqvjqrpuly9e/AAAWOVJFvT--UwYUx134D1Lca?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/8/21",
    		band: "Mannequin Pussy",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/rrx56tim2l4ysal/AAAQ08fikfBdyfP7WFpyY_rta?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/11/20",
    		band: "Oso Oso",
    		venue: "The Foundry",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/11/20",
    		band: "Prince Daddy & the Hyena",
    		venue: "The Foundry",
    		public_url: "https://www.dropbox.com/sh/9mxzo0g5ppnxgnw/AAB_k1JSi8EYUwZagQwozNb1a?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/11/20",
    		band: "Just Friends",
    		venue: "The Foundry",
    		public_url: "https://www.dropbox.com/sh/2nkpqohdt5q3nkf/AACPNa5y_X-POS5T0pn6h1aia?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/11/20",
    		band: "Sincere Engineer",
    		venue: "The Foundry",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "1/20/20",
    		band: "Indigo De Souza",
    		venue: "First Unitarian Church",
    		public_url: "https://www.dropbox.com/sh/rr99x3slhmxq09n/AADLMK81XJgYFmuzuIJ6nF_Ba?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/29/19",
    		band: "The Menzingers",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/29/19",
    		band: "Harvey and the High Lifers",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/29/19",
    		band: "Tigers Jaw",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/23/19",
    		band: "Boston Manor",
    		venue: "The Foundry",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/boston-manor/2019/the-foundry-at-the-fillmore-philadelphia-pa-639a3e7b.html",
    		"note\r": 0
    	},
    	{
    		date: "11/23/19",
    		band: "Microwave",
    		venue: "The Foundry",
    		public_url: "https://www.dropbox.com/sh/ubjvj2kva6oqk9e/AADoUvsGIg2jTI-bZGG7byu6a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/microwave/2019/the-foundry-at-the-fillmore-philadelphia-pa-5b9a3f80.html",
    		"note\r": 0
    	},
    	{
    		date: "11/23/19",
    		band: "Heart Attack Man",
    		venue: "The Foundry",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/20/19",
    		band: "La Dispute",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/oajdmm1gxi25jrz/AAAR1smAqUc9C0ddghwD2bxDa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/la-dispute/2019/union-transfer-philadelphia-pa-539adbb5.html",
    		"note\r": 0
    	},
    	{
    		date: "11/20/19",
    		band: "Touche Amore",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/xdetw85dj64tqrn/AAAmvoWT6ykxsp8QBy2Xv_Xba?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/20/19",
    		band: "Empath",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/11/19",
    		band: "PUP",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/afhmx9e4rggpfo4/AABexh1dQP32DNjIfALbNsLVa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/pup/2019/franklin-music-hall-philadelphia-pa-339c80b1.html",
    		"note\r": 0
    	},
    	{
    		date: "9/11/19",
    		band: "Illuminati Hotties",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/11/19",
    		band: "AJJ",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: "https://www.dropbox.com/sh/0kwzerxd105q2od/AAB3JCxA69iL18mZcGNByVqra?dl=0",
    		setlist: "https://www.setlist.fm/setlist/ajj/2019/franklin-music-hall-philadelphia-pa-639c82eb.html",
    		"note\r": 0
    	},
    	{
    		date: "8/22/19",
    		band: "Pedro the Lion",
    		venue: "Variety Playhouse",
    		public_url: "https://www.dropbox.com/sh/gnxymsfzrf80i29/AADTwKp3S-YUBmSDHPv3YI7Aa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/pedro-the-lion/2019/variety-playhouse-atlanta-ga-639f323f.html",
    		"note\r": 0
    	},
    	{
    		date: "8/22/19",
    		band: "mewithoutYou",
    		venue: "Variety Playhouse",
    		public_url: "https://www.dropbox.com/sh/ayxeolhbytuk9vd/AADAMBEibMiCUCQQE1QXooaBa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2019/variety-playhouse-atlanta-ga-6b9f323e.html",
    		"note\r": 0
    	},
    	{
    		date: "6/22/19",
    		band: "Hot Water Music",
    		venue: "Underground Arts",
    		public_url: "https://www.dropbox.com/sh/36n9ka69ulx6szg/AACGnsk1FKJNyYQp1AcU_9W8a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/hot-water-music/2019/underground-arts-philadelphia-pa-63911643.html",
    		"note\r": 0
    	},
    	{
    		date: "6/22/19",
    		band: "Boysetsfire",
    		venue: "Underground Arts",
    		public_url: "https://www.dropbox.com/sh/ifl4do5f624nusw/AADXjGt8WI1qz2J1XQiDmrfoa?dl=0",
    		setlist: "https://www.setlist.fm/setlist/restorations/2019/underground-arts-philadelphia-pa-1391695d.html",
    		"note\r": 0
    	},
    	{
    		date: "6/22/19",
    		band: "Restorations",
    		venue: "Underground Arts",
    		public_url: "https://www.dropbox.com/sh/ky0i97bbylqg63s/AABFGOA1RGqABM_n9ys6xPqTa?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/7/19",
    		band: "Pedro the Lion",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/fw94wydlxr0nzpj/AACKrzn_wj6yfJ0rwTf09e81a?dl=0",
    		setlist: "https://www.setlist.fm/setlist/pedro-the-lion/2019/union-transfer-philadelphia-pa-4b90ff6e.html",
    		"note\r": 0
    	},
    	{
    		date: "5/7/19",
    		band: "John Vanderslice",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/21/19",
    		band: "La Dispute",
    		venue: "Union Transfer",
    		public_url: "https://www.dropbox.com/sh/xd1rvajikqlltbr/AACDVVRvvtfRY-euYTuDS0Gza?dl=0",
    		setlist: "https://www.setlist.fm/setlist/la-dispute/2019/union-transfer-philadelphia-pa-393595b.html",
    		"note\r": 0
    	},
    	{
    		date: "4/21/19",
    		band: "Gouge Away",
    		venue: "Union Transfer",
    		public_url: "gouge away",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/21/19",
    		band: "Slow Mass",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/10/19",
    		band: "Touche Amore",
    		venue: "First Unitarian Church",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/touche-amore/2019/first-unitarian-church-philadelphia-pa-2b93301e.html",
    		"note\r": 0
    	},
    	{
    		date: "3/10/19",
    		band: "Pianos Become the Teeth",
    		venue: "First Unitarian Church",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/pianos-become-the-teeth/2019/first-unitarian-church-philadelphia-pa-4b9b5f56.html",
    		"note\r": 0
    	},
    	{
    		date: "3/10/19",
    		band: "Soul Glo",
    		venue: "First Unitarian Church",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/1/18",
    		band: "Circa Survive",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/circa-survive/2018/the-fillmore-philadelphia-philadelphia-pa-63974a47.html",
    		"note\r": 0
    	},
    	{
    		date: "12/1/18",
    		band: "La Dispute",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/la-dispute/2018/the-fillmore-philadelphia-philadelphia-pa-6b974a3e.html",
    		"note\r": 0
    	},
    	{
    		date: "12/1/18",
    		band: "Queen of Jeans",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "7/18/18",
    		band: "RUNA",
    		venue: "Pastorius Park",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/19/18",
    		band: "Hop Along",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/hop-along/2018/union-transfer-philadelphia-pa-13edc1e5.html",
    		"note\r": 0
    	},
    	{
    		date: "5/19/18",
    		band: "Eight",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/19/18",
    		band: "Nervous Dater",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/16/18",
    		band: "Moose Blood",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/moose-blood/2018/the-theatre-of-living-arts-philadelphia-pa-1bef3534.html",
    		"note\r": 0
    	},
    	{
    		date: "3/16/18",
    		band: "Lydia",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/lydia/2018/the-theatre-of-living-arts-philadelphia-pa-13ef3529.html",
    		"note\r": 0
    	},
    	{
    		date: "3/16/18",
    		band: "McCafferty",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/10/17",
    		band: "McCafferty",
    		venue: "Everybody Hits",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mccafferty/2017/everybody-hits-philadelphia-pa-7be1ba84.html",
    		"note\r": 0
    	},
    	{
    		date: "12/10/17",
    		band: "Heart Attack Man",
    		venue: "Everybody Hits",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/10/17",
    		band: "Caracara",
    		venue: "Everybody Hits",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/22/17",
    		band: "The Front Bottoms",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-front-bottoms/2017/the-fillmore-philadelphia-philadelphia-pa-1be0d128.html",
    		"note\r": 0
    	},
    	{
    		date: "11/22/17",
    		band: "Basement",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/22/17",
    		band: "Bad Bad Hates",
    		venue: "The Fillmore",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/14/17",
    		band: "Modern Baseball",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/modern-baseball/2017/union-transfer-philadelphia-pa-1be3ddd8.html",
    		"note\r": 0
    	},
    	{
    		date: "10/14/17",
    		band: "Harmony Woods",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/17",
    		band: "McCafferty",
    		venue: "PhilaMOCA",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mccafferty/2017/philamoca-philadelphia-pa-6be2daae.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/17",
    		band: "Remo Drive",
    		venue: "PhilaMOCA",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/remo-drive/2017/philamoca-philadelphia-pa-7be2dab8.html",
    		"note\r": 0
    	},
    	{
    		date: "3/20/17",
    		band: "Alcoa",
    		venue: "Boot & Saddle",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/19/17",
    		band: "Josh Garrels",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/19/17",
    		band: "John Mark McMillian",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/29/16",
    		band: "mewithoutYou",
    		venue: "Boot & Saddle",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2016/boot-and-saddle-philadelphia-pa-3fb6d33.html",
    		"note\r": 0
    	},
    	{
    		date: "7/27/16",
    		band: "RUNA",
    		venue: "Pastorius Park",
    		public_url: "https://www.dropbox.com/sh/mg7nwxxa2xp0990/AADUlFqx-ilxfzlV9zQJSxC3a?dl=0",
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/24/16",
    		band: "Into It. Over It.",
    		venue: "Creep Records",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/16/16",
    		band: "Underoath",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/underoath/2016/electric-factory-philadelphia-pa-1bf1fd54.html",
    		"note\r": 0
    	},
    	{
    		date: "4/3/16",
    		band: "Norma Jean",
    		venue: "Voltage Lounge",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/3/16",
    		band: "He is Legend",
    		venue: "Voltage Lounge",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/he-is-legend/2016/voltage-lounge-philadelphia-pa-73f1b669.html",
    		"note\r": 0
    	},
    	{
    		date: "4/3/16",
    		band: "Forevermore",
    		venue: "Voltage Lounge",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/24/15",
    		band: "The Menzingers",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-menzingers/2015/union-transfer-philadelphia-pa-3bf58050.html",
    		"note\r": 0
    	},
    	{
    		date: "10/24/15",
    		band: "mewithoutYou",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2015/union-transfer-philadelphia-pa-13f589d1.html",
    		"note\r": 0
    	},
    	{
    		date: "10/24/15",
    		band: "Pianos Become the Teeth",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/pianos-become-the-teeth/2015/union-transfer-philadelphia-pa-bf589de.html",
    		"note\r": 0
    	},
    	{
    		date: "10/24/15",
    		band: "Restorations",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/restorations/2015/union-transfer-philadelphia-pa-13f589d5.html",
    		"note\r": 0
    	},
    	{
    		date: "10/3/14",
    		band: "The Airborne Toxic Event",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-airborne-toxic-event/2014/electric-factory-philadelphia-pa-73cf4e65.html",
    		"note\r": 0
    	},
    	{
    		date: "10/3/14",
    		band: "In the Valley Below",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/17/14",
    		band: "The Deadmen",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/17/14",
    		band: "Maitland",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/17/14",
    		band: "The Lawsuits",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/17/14",
    		band: "Ali Wadsworth",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/17/14",
    		band: "Chill Moody",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/17/14",
    		band: "The Living Sample",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/22/13",
    		band: "Being As An Ocean",
    		venue: "The Note",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/being-as-an-ocean/2013/the-note-west-chester-pa-5bc01780.html",
    		"note\r": 0
    	},
    	{
    		date: "3/24/13",
    		band: "Restorations",
    		venue: "Saint Mark's",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/23/13",
    		band: "Alex G",
    		venue: "Church of the Advocate",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/23/13",
    		band: "Coma Cinema",
    		venue: "Church of the Advocate",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/23/13",
    		band: "Roof Doctor",
    		venue: "Church of the Advocate",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/23/13",
    		band: "Pill Friends",
    		venue: "Church of the Advocate",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/7/13",
    		band: "Balance and Composure",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/balance-and-composure/2013/union-transfer-philadelphia-pa-3bdb2020.html",
    		"note\r": 0
    	},
    	{
    		date: "2/7/13",
    		band: "The Jealous Sound",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-jealous-sound/2013/the-echo-los-angeles-ca-4bdb03a6.html",
    		"note\r": 0
    	},
    	{
    		date: "2/7/13",
    		band: "Daylight",
    		venue: "Union Transfer",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/superheaven/2013/the-echo-los-angeles-ca-43db039b.html",
    		"note\r": 0
    	},
    	{
    		date: "4/20/12",
    		band: "The Wonder Years",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-wonder-years/2012/the-theatre-of-living-arts-philadelphia-pa-23de6413.html",
    		"note\r": 0
    	},
    	{
    		date: "4/20/12",
    		band: "Polar Bear Club",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/20/12",
    		band: "Transit",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/20/12",
    		band: "Into It. Over It.",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/20/12",
    		band: "The Story So Far",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-story-so-far/2012/the-theatre-of-living-arts-philadelphia-pa-53c23be9.html",
    		"note\r": 0
    	},
    	{
    		date: "4/20/12",
    		band: "A Loss for Words",
    		venue: "Theatre of Living Arts",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/a-loss-for-words/2012/the-theatre-of-living-arts-philadelphia-pa-3bc224ec.html",
    		"note\r": 0
    	},
    	{
    		date: "3/28/12",
    		band: "The Devil Wears Prada",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-devil-wears-prada/2012/crocodile-rock-cafe-allentown-pa-73dfa6bd.html",
    		"note\r": 0
    	},
    	{
    		date: "3/28/12",
    		band: "letlive.",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/letlive/2012/crocodile-rock-cafe-allentown-pa-73de26a5.html",
    		"note\r": 0
    	},
    	{
    		date: "3/28/12",
    		band: "Every Time I Die",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/every-time-i-die/2012/crocodile-rock-cafe-allentown-pa-63de269b.html",
    		"note\r": 0
    	},
    	{
    		date: "3/28/12",
    		band: "Oh, Sleeper",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/oh-sleeper/2012/crocodile-rock-cafe-allentown-pa-63de26a7.html",
    		"note\r": 0
    	},
    	{
    		date: "1/24/12",
    		band: "Empire! Empire! (I Was a Lonely Estate)",
    		venue: "Skid Row Garage",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/26/11",
    		band: "Anberlin",
    		venue: "The Trocadero",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Switchfoot",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Owl City",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Family Force 5",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Third Day",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "RED",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Skillet",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Brian Head Welch",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "Emery",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/29/11",
    		band: "The Almost",
    		venue: "Creation Festival",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "6/1/11",
    		band: "Johnny Flynn",
    		venue: "World Cafe Live",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "2/2/11",
    		band: "Aaron Gillespie",
    		venue: "Lebanon Valley College",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "1/31/11",
    		band: "Anberlin",
    		venue: "Chameleon Club",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "1/31/11",
    		band: "Kingsfoil",
    		venue: "Chameleon Club",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "August Burns Red",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/august-burns-red/2010/revelation-farms-frenchtown-nj-3d5edf3.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "The O.C. Supertones",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-oc-supertones/2010/revelation-farms-frenchtown-nj-5bd5d39c.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Anberlin",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "A Plea For Purging",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Emery",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "I Am Alpha and Omega",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Maylene and the Sons of Disaster",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "MyChildren MyBride",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Oh, Sleeper",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Showbread",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Sleeping Giant",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Texas in July",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "The Almost",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "The Crimson Armada",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "The Devil Wears Prada",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-devil-wears-prada/2010/revelation-farms-frenchtown-nj-5bc19f08.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Impending Doom",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "Fireflight",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/fireflight/2010/revelation-farms-frenchtown-nj-13c2a1a5.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/10",
    		band: "The O.C. Supertones",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-oc-supertones/2010/revelation-farms-frenchtown-nj-5bd5d39c.html",
    		"note\r": 0
    	},
    	{
    		date: "6/25/10",
    		band: "Phish",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/13/10",
    		band: "Oh, Sleeper",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/13/10",
    		band: "Greeley Estates",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/1/09",
    		band: "August Burns Red",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/1/09",
    		band: "Underoath",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "12/1/09",
    		band: "Emery",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "11/25/09",
    		band: "Phish",
    		venue: "Spectrum",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/10/09",
    		band: "August Burns Red",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/10/09",
    		band: "The Acacia Strain",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "10/10/09",
    		band: "MyChildren MyBride",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/mychildren-mybride/2009/crocodile-rock-cafe-allentown-pa-5bcbe330.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Underoath",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Before Their Eyes",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "And Then There Were None",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "August Burns Red",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Emery",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Fireflight",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/fireflight/2009/revelation-farms-frenchtown-nj-63c56ecf.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Switchfoot",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/switchfoot/2009/revelation-farms-frenchtown-nj-43952f7b.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Flyleaf",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/flyleaf/2009/revelation-farms-frenchtown-nj-6bcf9e72.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Haste the Day",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Impending Doom",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "MyChildren MyBride",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "Norma Jean",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "The Devil Wears Prada",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-devil-wears-prada/2009/revelation-farms-frenchtown-nj-13c1b1ed.html",
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "The Glorious Unseen",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "A Plea For Purging",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/5/09",
    		band: "I Am Alpha and Omega",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "7/17/09",
    		band: "Ween",
    		venue: "The Stone Pony",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/ween/2009/the-stone-pony-asbury-park-nj-13d489ad.html",
    		"note\r": 0
    	},
    	{
    		date: "6/11/09",
    		band: "No Doubt",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/no-doubt/2009/susquehanna-bank-center-camden-nj-53d60f35.html",
    		"note\r": 0
    	},
    	{
    		date: "6/11/09",
    		band: "Paramore",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/paramore/2009/susquehanna-bank-center-camden-nj-43d7977f.html",
    		"note\r": 0
    	},
    	{
    		date: "4/1/09",
    		band: "Parkway Drive",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/1/09",
    		band: "MyChildren MyBride",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "4/1/09",
    		band: "Stick To Your Guns",
    		venue: "Crocodile Rock Cafe",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "3/19/09",
    		band: "Fireflight",
    		venue: "Lebanon Valley College",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/fireflight/2009/lebanon-valley-college-annville-pa-6bc57612.html",
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "As I Lay Dying",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "Flyleaf",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/flyleaf/2008/revelation-farms-frenchtown-nj-53cbafb5.html",
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "August Burns Red",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "Norma Jean",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "The Devil Wears Prada",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "Emery",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/2/08",
    		band: "The Almost",
    		venue: "Revelation Generation",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/22/08",
    		band: "Underoath",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/22/08",
    		band: "Saosin",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/22/08",
    		band: "The Devil Wears Prada",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "8/22/08",
    		band: "P.O.S.",
    		venue: "Franklin Music Hall (Electric Factory)",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "5/10/08",
    		band: "The Cure",
    		venue: "Spectrum",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/the-cure/2008/wachovia-spectrum-philadelphia-pa-53d69341.html",
    		"note\r": 0
    	},
    	{
    		date: "5/10/08",
    		band: "65daysofstatic",
    		venue: "Spectrum",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/65daysofstatic/2008/wachovia-spectrum-philadelphia-pa-53dedb95.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Willie Nelson",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/willie-nelson/2006/tweeter-center-camden-nj-23db88f7.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "John Mellencamp",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/john-mellencamp/2006/tweeter-center-camden-nj-7bc72e58.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Neil Young",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/neil-young/2006/tweeter-center-camden-nj-bda39ca.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Dave Matthews",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/dave-matthews/2006/tweeter-center-camden-nj-3d6252f.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Jerry Lee Lewis with Roy Head",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/jerry-lee-lewis/2006/tweeter-center-camden-nj-6bc72e5e.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Los Lonely Boys",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/los-lonely-boys/2006/tweeter-center-camden-nj-7bc72e5c.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Gov't Mule",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: "https://www.setlist.fm/setlist/govt-mule/2006/tweeter-center-camden-nj-2bdc20ce.html",
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Steve Earle and Allison Moorer",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Steel Pulse",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Shelby Lynne",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Nitty Gritty Dirt Band",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Jimmy Sturr & his Orchestra",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Pauline Reese",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	},
    	{
    		date: "9/30/06",
    		band: "Danielle Evin",
    		venue: "Waterfront Music Pavilion",
    		public_url: 0,
    		setlist: 0,
    		"note\r": 0
    	}
    ];

    /* src/App.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (34:14) {#if row.setlist}
    function create_if_block_1(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("📄");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = /*row*/ ctx[7].setlist);
    			attr_dev(a, "class", "svelte-1t4xoeo");
    			add_location(a, file, 33, 32, 1044);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredGroupedConcerts*/ 2 && a_href_value !== (a_href_value = /*row*/ ctx[7].setlist)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(34:14) {#if row.setlist}",
    		ctx
    	});

    	return block;
    }

    // (35:14) {#if row.public_url}
    function create_if_block(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("📷");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = /*row*/ ctx[7].public_url);
    			attr_dev(a, "class", "svelte-1t4xoeo");
    			add_location(a, file, 34, 35, 1129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredGroupedConcerts*/ 2 && a_href_value !== (a_href_value = /*row*/ ctx[7].public_url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(35:14) {#if row.public_url}",
    		ctx
    	});

    	return block;
    }

    // (29:10) {#each concert[1] as row, i}
    function create_each_block_1(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*row*/ ctx[7].band + "";
    	let t0;
    	let t1;
    	let t2;
    	let if_block0 = /*row*/ ctx[7].setlist && create_if_block_1(ctx);
    	let if_block1 = /*row*/ ctx[7].public_url && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(h3, "class", "svelte-1t4xoeo");
    			add_location(h3, file, 30, 14, 933);
    			attr_dev(div, "class", "band-content svelte-1t4xoeo");
    			add_location(div, file, 29, 12, 892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			if (if_block0) if_block0.m(h3, null);
    			append_dev(h3, t2);
    			if (if_block1) if_block1.m(h3, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredGroupedConcerts*/ 2 && t0_value !== (t0_value = /*row*/ ctx[7].band + "")) set_data_dev(t0, t0_value);

    			if (/*row*/ ctx[7].setlist) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(h3, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*row*/ ctx[7].public_url) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(h3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(29:10) {#each concert[1] as row, i}",
    		ctx
    	});

    	return block;
    }

    // (27:6) {#each filteredGroupedConcerts as concert, i}
    function create_each_block(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let t1;
    	let t2_value = /*concert*/ ctx[4][1][0].venue + "";
    	let t2;
    	let t3;
    	let t4_value = /*concert*/ ctx[4][0] + "";
    	let t4;
    	let t5;
    	let each_value_1 = /*concert*/ ctx[4][1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div0 = element("div");
    			t1 = text("@ ");
    			t2 = text(t2_value);
    			t3 = text(" on ");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(div0, "class", "show-content svelte-1t4xoeo");
    			add_location(div0, file, 38, 10, 1253);
    			attr_dev(div1, "class", "concert-cell svelte-1t4xoeo");
    			add_location(div1, file, 27, 8, 814);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div1, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filteredGroupedConcerts*/ 2) {
    				each_value_1 = /*concert*/ ctx[4][1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*filteredGroupedConcerts*/ 2 && t2_value !== (t2_value = /*concert*/ ctx[4][1][0].venue + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*filteredGroupedConcerts*/ 2 && t4_value !== (t4_value = /*concert*/ ctx[4][0] + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:6) {#each filteredGroupedConcerts as concert, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t0;
    	let intro;
    	let t1;
    	let div0;
    	let input;
    	let t2;
    	let div1;
    	let t3;
    	let footer;
    	let div2;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });

    	intro = new Intro({
    			props: {
    				concerts,
    				groupedConcerts: /*groupedConcerts*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let each_value = /*filteredGroupedConcerts*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(intro.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			footer = element("footer");
    			div2 = element("div");
    			div2.textContent = "Design and code by Jared Whalen | © 2021 Jared Whalen";
    			attr_dev(input, "placeholder", "Search a band name...");
    			attr_dev(input, "class", "svelte-1t4xoeo");
    			add_location(input, file, 23, 6, 649);
    			attr_dev(div0, "class", "input-wrapper svelte-1t4xoeo");
    			add_location(div0, file, 22, 4, 615);
    			attr_dev(div1, "id", "concerts");
    			add_location(div1, file, 25, 4, 734);
    			attr_dev(main, "id", "App");
    			attr_dev(main, "class", "svelte-1t4xoeo");
    			add_location(main, file, 18, 0, 542);
    			add_location(div2, file, 45, 0, 1383);
    			attr_dev(footer, "class", "svelte-1t4xoeo");
    			add_location(footer, file, 44, 0, 1374);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);
    			mount_component(intro, main, null);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*searchTerm*/ ctx[0]);
    			append_dev(main, t2);
    			append_dev(main, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			insert_dev(target, t3, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchTerm*/ 1 && input.value !== /*searchTerm*/ ctx[0]) {
    				set_input_value(input, /*searchTerm*/ ctx[0]);
    			}

    			if (dirty & /*filteredGroupedConcerts*/ 2) {
    				each_value = /*filteredGroupedConcerts*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro$1(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(intro.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(intro.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(intro);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			dispose();
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
    	let filteredGroupedConcerts;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	concerts.sort((a, b) => new Date(b.date) - new Date(a.date));
    	let groupedConcerts = Object.entries(groupBy(concerts, "date"));
    	let searchTerm = "";
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchTerm = this.value;
    		$$invalidate(0, searchTerm);
    	}

    	$$self.$capture_state = () => ({
    		Meta,
    		Header,
    		Intro,
    		concerts,
    		groupBy,
    		groupedConcerts,
    		searchTerm,
    		filteredGroupedConcerts
    	});

    	$$self.$inject_state = $$props => {
    		if ("groupedConcerts" in $$props) $$invalidate(2, groupedConcerts = $$props.groupedConcerts);
    		if ("searchTerm" in $$props) $$invalidate(0, searchTerm = $$props.searchTerm);
    		if ("filteredGroupedConcerts" in $$props) $$invalidate(1, filteredGroupedConcerts = $$props.filteredGroupedConcerts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchTerm*/ 1) {
    			$$invalidate(1, filteredGroupedConcerts = groupedConcerts.filter(x => x[1].some(item => item.band.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1)));
    		}
    	};

    	return [searchTerm, filteredGroupedConcerts, groupedConcerts, input_input_handler];
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

    let target = document.querySelector("body");

    // *** Use with Webflow ***
    // let target;
    // if ({"env":{"isProd":false}}.env.isProd) {
    //   target = document.querySelector("main");
    // } else {
    //   target = document.querySelector("body");
    // }
    const app = new App({
      target,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
