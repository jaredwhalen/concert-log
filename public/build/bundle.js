
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    const file$1 = "src/Meta.svelte";

    function create_fragment$1(ctx) {
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
    			add_location(meta0, file$1, 5, 2, 90);
    			attr_dev(meta1, "http-equiv", "X-UA-Compatible");
    			attr_dev(meta1, "content", "IE=edge");
    			add_location(meta1, file$1, 6, 2, 117);
    			attr_dev(meta2, "name", "viewport");
    			attr_dev(meta2, "content", "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no");
    			add_location(meta2, file$1, 7, 2, 175);
    			attr_dev(meta3, "property", "fullbleed");
    			attr_dev(meta3, "content", "false");
    			add_location(meta3, file$1, 11, 2, 310);
    			attr_dev(meta4, "property", "slug");
    			attr_dev(meta4, "content", projectConfig.project.slug);
    			add_location(meta4, file$1, 12, 2, 358);
    			attr_dev(link, "rel", "icon");
    			attr_dev(link, "type", "image/png");
    			attr_dev(link, "href", "https://static.axios.com/img/axiosvisuals-favicon-128x128.png");
    			attr_dev(link, "sizes", "128x128");
    			add_location(link, file$1, 13, 2, 422);
    			attr_dev(meta5, "property", "apple-fallback");
    			attr_dev(meta5, "content", `fallbacks/${projectConfig.project.slug}-apple.png`);
    			add_location(meta5, file$1, 19, 2, 564);
    			attr_dev(meta6, "property", "newsletter-fallback");
    			attr_dev(meta6, "content", `fallbacks/${projectConfig.project.slug}-fallback.png`);
    			add_location(meta6, file$1, 23, 2, 673);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Meta",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var concerts = [
    	{
    		note: "",
    		band: "The Menzingers",
    		date: "2021-10-10",
    		public_url: "",
    		venue: "Ardmore Music Hall",
    		setlist: "https://www.setlist.fm/setlist/the-menzingers/2021/the-ardmore-music-hall-ardmore-pa-238d3447.html"
    	},
    	{
    		note: "",
    		band: "West Philadelphia Orchestra",
    		date: "2021-10-10",
    		public_url: "https://www.dropbox.com/sh/bfkbqzq6e4frqap/AABBeS1mvQUfvcN8fQiP4I3da?dl=0",
    		venue: "Ardmore Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Queen of Jeans",
    		date: "2021-10-10",
    		public_url: "",
    		venue: "Ardmore Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Hop Along",
    		date: "2021-09-18",
    		public_url: "https://www.dropbox.com/sh/itrsd1kxf45so78/AAAxXhh-nY3oer-DICogZnN3a?dl=0",
    		venue: "Ardmore Music Hall",
    		setlist: "https://www.setlist.fm/setlist/hop-along/2021/the-ardmore-music-hall-ardmore-pa-b8da98e.html"
    	},
    	{
    		note: "",
    		band: "Tenci",
    		date: "2021-09-18",
    		public_url: "",
    		venue: "Ardmore Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "mewithoutYou",
    		date: "2021-08-15",
    		public_url: "https://www.dropbox.com/sh/za8sac6pfad453l/AADbbFhTGIAGNLoUWUDz_ym_a?dl=0",
    		venue: "Union Transfer",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2021/union-transfer-philadelphia-pa-4b8cbf46.html"
    	},
    	{
    		note: "",
    		band: "Dominic Angelella",
    		date: "2021-08-15",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: "https://www.setlist.fm/setlist/dominic-angelella/2021/union-transfer-philadelphia-pa-138cb569.html"
    	},
    	{
    		note: "",
    		band: "mewithoutYou",
    		date: "2021-08-14",
    		public_url: "https://www.dropbox.com/sh/em4ust4xmwqyn2z/AAAnkUrNL3RNOyAAdiV53kOxa?dl=0",
    		venue: "Union Transfer",
    		setlist: "https://www.setlist.fm/setlist/mewithoutyou/2021/union-transfer-philadelphia-pa-b8f45d2.html"
    	},
    	{
    		note: "",
    		band: "Unwed Sailor",
    		date: "2021-08-14",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: "https://www.setlist.fm/setlist/unwed-sailor/2021/union-transfer-philadelphia-pa-38cb56b.html"
    	},
    	{
    		note: "",
    		band: "Japanese Breakfast",
    		date: "2021-08-08",
    		public_url: "https://www.dropbox.com/sh/4sstqvjqrpuly9e/AAAWOVJFvT--UwYUx134D1Lca?dl=0",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Mannequin Pussy",
    		date: "2021-08-08",
    		public_url: "https://www.dropbox.com/sh/rrx56tim2l4ysal/AAAQ08fikfBdyfP7WFpyY_rta?dl=0",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Oso Oso",
    		date: "2020-03-11",
    		public_url: "",
    		venue: "The Foundry",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Prince Daddy & the Hyena",
    		date: "2020-03-11",
    		public_url: "https://www.dropbox.com/sh/9mxzo0g5ppnxgnw/AAB_k1JSi8EYUwZagQwozNb1a?dl=0",
    		venue: "The Foundry",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Just Friends",
    		date: "2020-03-11",
    		public_url: "https://www.dropbox.com/sh/2nkpqohdt5q3nkf/AACPNa5y_X-POS5T0pn6h1aia?dl=0",
    		venue: "The Foundry",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Sincere Engineer",
    		date: "2020-03-11",
    		public_url: "",
    		venue: "The Foundry",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Indigo De Souza",
    		date: "2020-01-20",
    		public_url: "https://www.dropbox.com/sh/rr99x3slhmxq09n/AADLMK81XJgYFmuzuIJ6nF_Ba?dl=0",
    		venue: "First Unitarian Church",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Menzingers",
    		date: "2019-11-29",
    		public_url: "",
    		venue: "Franklin Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Harvey and the High Lifers",
    		date: "2019-11-29",
    		public_url: "",
    		venue: "Franklin Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Tigers Jaw",
    		date: "2019-11-29",
    		public_url: "",
    		venue: "Franklin Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Microwave",
    		date: "2019-11-23",
    		public_url: "",
    		venue: "The Foundry",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Heart Attack Man",
    		date: "2019-11-23",
    		public_url: "",
    		venue: "The Foundry",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "La Dispute",
    		date: "2019-11-20",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Touche Amore",
    		date: "2019-11-20",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Empath",
    		date: "2019-11-20",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Pup",
    		date: "2019-09-11",
    		public_url: "",
    		venue: "Franklin Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Illuminati Hotties",
    		date: "2019-09-11",
    		public_url: "",
    		venue: "Franklin Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "AJJ",
    		date: "2019-09-11",
    		public_url: "",
    		venue: "Franklin Music Hall",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Pedro the Lion",
    		date: "2019-08-22",
    		public_url: "",
    		venue: "Variety Playhouse",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "mewithoutYou",
    		date: "2019-08-22",
    		public_url: "",
    		venue: "Variety Playhouse",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Hot Water Music",
    		date: "2019-06-22",
    		public_url: "",
    		venue: "Underground Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Boysetsfire",
    		date: "2019-06-22",
    		public_url: "",
    		venue: "Underground Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Restorations",
    		date: "2019-06-22",
    		public_url: "",
    		venue: "Underground Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Pedro the Lion",
    		date: "2019-05-07",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "John Vanderslice",
    		date: "2019-05-07",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "La Dispute",
    		date: "2019-04-21",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Gouge Away",
    		date: "2019-04-21",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Slow Mass",
    		date: "2019-04-21",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Touche Amore",
    		date: "2019-03-10",
    		public_url: "",
    		venue: "First Unitarian Church",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Pianos Become the Teeth",
    		date: "2019-03-10",
    		public_url: "",
    		venue: "First Unitarian Church",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Circa Survive",
    		date: "2018-12-01",
    		public_url: "",
    		venue: "The Fillmore",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "La Dispute",
    		date: "2018-12-01",
    		public_url: "",
    		venue: "The Fillmore",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Hop Along",
    		date: "2018-05-19",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Eight",
    		date: "2018-05-19",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Nervous Dater",
    		date: "2018-05-19",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Moose Blood",
    		date: "2018-03-16",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "McCafferty",
    		date: "2018-03-16",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "McCafferty",
    		date: "2017-12-10",
    		public_url: "",
    		venue: "Everybody Hits",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Heart Attack Man",
    		date: "2017-12-10",
    		public_url: "",
    		venue: "Everybody Hits",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Caracara",
    		date: "2017-12-10",
    		public_url: "",
    		venue: "Everybody Hits",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Front Bottoms",
    		date: "2017-11-22",
    		public_url: "",
    		venue: "The Fillmore",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Modern Baseball",
    		date: "2017-10-14",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "McCafferty",
    		date: "2017-09-05",
    		public_url: "",
    		venue: "PhilaMOCA",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Remo Drive",
    		date: "2017-09-05",
    		public_url: "",
    		venue: "PhilaMOCA",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Alcoa",
    		date: "2017-03-20",
    		public_url: "",
    		venue: "The Boot & Saddle",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Josh Garrels",
    		date: "2017-02-19",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "John Mark McMillian",
    		date: "2017-02-19",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "mewithoutYou",
    		date: "2016-12-29",
    		public_url: "",
    		venue: "The Boot & Saddle",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Underoath",
    		date: "2016-04-16",
    		public_url: "",
    		venue: "The Electric Factory",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Norma Jean",
    		date: "2016-04-03",
    		public_url: "",
    		venue: "Voltage Lounge",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "He is Legend",
    		date: "2016-04-03",
    		public_url: "",
    		venue: "Voltage Lounge",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Forevermore",
    		date: "2016-04-03",
    		public_url: "",
    		venue: "Voltage Lounge",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Menzingers",
    		date: "2015-10-24",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "mewithoutYou",
    		date: "2015-10-24",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Pianos Become the Teeth",
    		date: "2015-10-24",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Restorations",
    		date: "2015-10-24",
    		public_url: "",
    		venue: "Union Transfer",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Being As An Ocean",
    		date: "2013-10-22",
    		public_url: "",
    		venue: "The Note",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Wonder Years",
    		date: "2012-04-19",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Polar Bear Club",
    		date: "2012-04-19",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Transit",
    		date: "2012-04-19",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Into It. Over It.",
    		date: "2012-04-19",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Story So Far",
    		date: "2012-04-19",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "A Loss for Words",
    		date: "2012-04-19",
    		public_url: "",
    		venue: "Theatre of Living Arts",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Devil Wears Prada",
    		date: "2012-03-28",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "letlive.",
    		date: "2012-03-28",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Every Time I Die",
    		date: "2012-03-28",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Oh, Sleeper",
    		date: "2012-03-28",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Anberlin",
    		date: "2011-01-31",
    		public_url: "",
    		venue: "Chameleon Club",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Kingsfoil",
    		date: "2011-01-31",
    		public_url: "",
    		venue: "Chameleon Club",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Anberlin",
    		date: "2011-09-26",
    		public_url: "",
    		venue: "The Trocadero",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Johnny Flynn",
    		date: "2011-06-01",
    		public_url: "",
    		venue: "World Café Live",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "August Burns Red",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Anberlin",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "A Plea For Purging",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Emery",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "I Am Alpha and Omega",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Maylene and the Sons of Disaster",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "MyChildren MyBride",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Oh, Sleeper",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Showbread",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Sleeping Giant",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Texas in July",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Almost",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Crimson Armada",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Devil Wears Prada",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The O.C. Supertones",
    		date: "2010-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Oh, Sleeper",
    		date: "2010-05-13",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Greeley Estates",
    		date: "2010-05-13",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "August Burns Red",
    		date: "2009-12-01",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Underoath",
    		date: "2009-12-01",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Emery",
    		date: "2009-12-01",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "August Burns Red",
    		date: "2009-10-10",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Acacia Strain",
    		date: "2009-10-10",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "MyChildren MyBride",
    		date: "2009-10-10",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Underoath",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "And Then There Were None",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "August Burns Red",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Emery",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Flyleaf",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Haste the Day",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Impending Doom",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "MyChildren MyBride",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Norma Jean",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Devil Wears Prada",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Glorious Unseen",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "A Plea For Purging",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "I Am Alpha and Omega",
    		date: "2009-09-05",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Parkway Drive",
    		date: "2009-04-01",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "MyChildren MyBride",
    		date: "2009-04-01",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Stick To Your Guns",
    		date: "2009-04-01",
    		public_url: "",
    		venue: "Crocodile Rock Cafe",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "As I Lay Dying",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Flyleaf",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "August Burns Red",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Norma Jean",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Devil Wears Prada",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "Emery",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	},
    	{
    		note: "",
    		band: "The Almost",
    		date: "2008-09-02",
    		public_url: "",
    		venue: "Revelation Generation",
    		setlist: ""
    	}
    ];

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*! pym.js - v1.3.2 - 2018-02-13 */

    var pym_v1 = createCommonjsModule(function (module) {
    /*
    * Pym.js is library that resizes an iframe based on the width of the parent and the resulting height of the child.
    * Check out the docs at http://blog.apps.npr.org/pym.js/ or the readme at README.md for usage.
    */

    /** @module pym */
    (function(factory) {
        if (module.exports) {
            module.exports = factory();
        } else {
            window.pym = factory.call(this);
        }
    })(function() {
        var MESSAGE_DELIMITER = 'xPYMx';

        var lib = {};

        /**
        * Create and dispatch a custom pym event
        *
        * @method _raiseCustomEvent
        * @inner
        *
        * @param {String} eventName
        */
       var _raiseCustomEvent = function(eventName) {
         var event = document.createEvent('Event');
         event.initEvent('pym:' + eventName, true, true);
         document.dispatchEvent(event);
       };

        /**
        * Generic function for parsing URL params.
        * Via http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
        *
        * @method _getParameterByName
        * @inner
        *
        * @param {String} name The name of the paramter to get from the URL.
        */
        var _getParameterByName = function(name) {
            var regex = new RegExp("[\\?&]" + name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]') + '=([^&#]*)');
            var results = regex.exec(location.search);

            if (results === null) {
                return '';
            }

            return decodeURIComponent(results[1].replace(/\+/g, " "));
        };

        /**
         * Check the message to make sure it comes from an acceptable xdomain.
         * Defaults to '*' but can be overriden in config.
         *
         * @method _isSafeMessage
         * @inner
         *
         * @param {Event} e The message event.
         * @param {Object} settings Configuration.
         */
        var _isSafeMessage = function(e, settings) {
            if (settings.xdomain !== '*') {
                // If origin doesn't match our xdomain, return.
                if (!e.origin.match(new RegExp(settings.xdomain + '$'))) { return; }
            }

            // Ignore events that do not carry string data #151
            if (typeof e.data !== 'string') { return; }

            return true;
        };

        var _isSafeUrl = function(url) {
            // Adapted from angular 2 url sanitizer
            var SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp):|[^&:/?#]*(?:[/?#]|$))/gi;
            if (!url.match(SAFE_URL_PATTERN)) { return; }
            
            return true;
        };

        /**
         * Construct a message to send between frames.
         *
         * NB: We use string-building here because JSON message passing is
         * not supported in all browsers.
         *
         * @method _makeMessage
         * @inner
         *
         * @param {String} id The unique id of the message recipient.
         * @param {String} messageType The type of message to send.
         * @param {String} message The message to send.
         */
        var _makeMessage = function(id, messageType, message) {
            var bits = ['pym', id, messageType, message];

            return bits.join(MESSAGE_DELIMITER);
        };

        /**
         * Construct a regex to validate and parse messages.
         *
         * @method _makeMessageRegex
         * @inner
         *
         * @param {String} id The unique id of the message recipient.
         */
        var _makeMessageRegex = function(id) {
            var bits = ['pym', id, '(\\S+)', '(.*)'];

            return new RegExp('^' + bits.join(MESSAGE_DELIMITER) + '$');
        };

        /**
        * Underscore implementation of getNow
        *
        * @method _getNow
        * @inner
        *
        */
        var _getNow = Date.now || function() {
            return new Date().getTime();
        };

        /**
        * Underscore implementation of throttle
        *
        * @method _throttle
        * @inner
        *
        * @param {function} func Throttled function
        * @param {number} wait Throttle wait time
        * @param {object} options Throttle settings
        */

        var _throttle = function(func, wait, options) {
            var context, args, result;
            var timeout = null;
            var previous = 0;
            if (!options) {options = {};}
            var later = function() {
                previous = options.leading === false ? 0 : _getNow();
                timeout = null;
                result = func.apply(context, args);
                if (!timeout) {context = args = null;}
            };
            return function() {
                var now = _getNow();
                if (!previous && options.leading === false) {previous = now;}
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout) {context = args = null;}
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        };

        /**
         * Clean autoInit Instances: those that point to contentless iframes
         * @method _cleanAutoInitInstances
         * @inner
         */
        var _cleanAutoInitInstances = function() {
            var length = lib.autoInitInstances.length;

            // Loop backwards to avoid index issues
            for (var idx = length - 1; idx >= 0; idx--) {
                var instance = lib.autoInitInstances[idx];
                // If instance has been removed or is contentless then remove it
                if (instance.el.getElementsByTagName('iframe').length &&
                    instance.el.getElementsByTagName('iframe')[0].contentWindow) {
                    continue;
                }
                else {
                    // Remove the reference to the removed or orphan instance
                    lib.autoInitInstances.splice(idx,1);
                }
            }
        };

        /**
         * Store auto initialized Pym instances for further reference
         * @name module:pym#autoInitInstances
         * @type Array
         * @default []
         */
        lib.autoInitInstances = [];

        /**
         * Initialize Pym for elements on page that have data-pym attributes.
         * Expose autoinit in case we need to call it from the outside
         * @instance
         * @method autoInit
         * @param {Boolean} doNotRaiseEvents flag to avoid sending custom events
         */
        lib.autoInit = function(doNotRaiseEvents) {
            var elements = document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])');
            var length = elements.length;

            // Clean stored instances in case needed
            _cleanAutoInitInstances();
            for (var idx = 0; idx < length; ++idx) {
                var element = elements[idx];
                /*
                * Mark automatically-initialized elements so they are not
                * re-initialized if the user includes pym.js more than once in the
                * same document.
                */
                element.setAttribute('data-pym-auto-initialized', '');

                // Ensure elements have an id
                if (element.id === '') {
                    element.id = 'pym-' + idx + "-" + Math.random().toString(36).substr(2,5);
                }

                var src = element.getAttribute('data-pym-src');

                // List of data attributes to configure the component
                // structure: {'attribute name': 'type'}
                var settings = {'xdomain': 'string', 'title': 'string', 'name': 'string', 'id': 'string',
                                'sandbox': 'string', 'allowfullscreen': 'boolean',
                                'parenturlparam': 'string', 'parenturlvalue': 'string',
                                'optionalparams': 'boolean', 'trackscroll': 'boolean',
                                'scrollwait': 'number'};

                var config = {};

                for (var attribute in settings) {
                    // via https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#Notes
                   if (element.getAttribute('data-pym-'+attribute) !== null) {
                      switch (settings[attribute]) {
                        case 'boolean':
                           config[attribute] = !(element.getAttribute('data-pym-'+attribute) === 'false'); // jshint ignore:line
                           break;
                        case 'string':
                           config[attribute] = element.getAttribute('data-pym-'+attribute);
                           break;
                        case 'number':
                            var n = Number(element.getAttribute('data-pym-'+attribute));
                            if (!isNaN(n)) {
                                config[attribute] = n;
                            }
                            break;
                        default:
                           console.err('unrecognized attribute type');
                      }
                   }
                }

                // Store references to autoinitialized pym instances
                var parent = new lib.Parent(element.id, src, config);
                lib.autoInitInstances.push(parent);
            }

            // Fire customEvent
            if (!doNotRaiseEvents) {
                _raiseCustomEvent("pym-initialized");
            }
            // Return stored autoinitalized pym instances
            return lib.autoInitInstances;
        };

        /**
         * The Parent half of a response iframe.
         *
         * @memberof module:pym
         * @class Parent
         * @param {String} id The id of the div into which the iframe will be rendered. sets {@link module:pym.Parent~id}
         * @param {String} url The url of the iframe source. sets {@link module:pym.Parent~url}
         * @param {Object} [config] Configuration for the parent instance. sets {@link module:pym.Parent~settings}
         * @param {string} [config.xdomain='*'] - xdomain to validate messages received
         * @param {string} [config.title] - if passed it will be assigned to the iframe title attribute
         * @param {string} [config.name] - if passed it will be assigned to the iframe name attribute
         * @param {string} [config.id] - if passed it will be assigned to the iframe id attribute
         * @param {boolean} [config.allowfullscreen] - if passed and different than false it will be assigned to the iframe allowfullscreen attribute
         * @param {string} [config.sandbox] - if passed it will be assigned to the iframe sandbox attribute (we do not validate the syntax so be careful!!)
         * @param {string} [config.parenturlparam] - if passed it will be override the default parentUrl query string parameter name passed to the iframe src
         * @param {string} [config.parenturlvalue] - if passed it will be override the default parentUrl query string parameter value passed to the iframe src
         * @param {string} [config.optionalparams] - if passed and different than false it will strip the querystring params parentUrl and parentTitle passed to the iframe src
         * @param {boolean} [config.trackscroll] - if passed it will activate scroll tracking on the parent
         * @param {number} [config.scrollwait] - if passed it will set the throttle wait in order to fire scroll messaging. Defaults to 100 ms.
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe iFrame}
         */
        lib.Parent = function(id, url, config) {
            /**
             * The id of the container element
             *
             * @memberof module:pym.Parent
             * @member {string} id
             * @inner
             */
            this.id = id;
            /**
             * The url that will be set as the iframe's src
             *
             * @memberof module:pym.Parent
             * @member {String} url
             * @inner
             */
            this.url = url;

            /**
             * The container DOM object
             *
             * @memberof module:pym.Parent
             * @member {HTMLElement} el
             * @inner
             */
            this.el = document.getElementById(id);
            /**
             * The contained child iframe
             *
             * @memberof module:pym.Parent
             * @member {HTMLElement} iframe
             * @inner
             * @default null
             */
            this.iframe = null;
            /**
             * The parent instance settings, updated by the values passed in the config object
             *
             * @memberof module:pym.Parent
             * @member {Object} settings
             * @inner
             */
            this.settings = {
                xdomain: '*',
                optionalparams: true,
                parenturlparam: 'parentUrl',
                parenturlvalue: window.location.href,
                trackscroll: false,
                scrollwait: 100,
            };
            /**
             * RegularExpression to validate the received messages
             *
             * @memberof module:pym.Parent
             * @member {String} messageRegex
             * @inner
             */
            this.messageRegex = _makeMessageRegex(this.id);
            /**
             * Stores the registered messageHandlers for each messageType
             *
             * @memberof module:pym.Parent
             * @member {Object} messageHandlers
             * @inner
             */
            this.messageHandlers = {};

            // ensure a config object
            config = (config || {});

            /**
             * Construct the iframe.
             *
             * @memberof module:pym.Parent
             * @method _constructIframe
             * @inner
             */
            this._constructIframe = function() {
                // Calculate the width of this element.
                var width = this.el.offsetWidth.toString();

                // Create an iframe element attached to the document.
                this.iframe = document.createElement('iframe');

                // Save fragment id
                var hash = '';
                var hashIndex = this.url.indexOf('#');

                if (hashIndex > -1) {
                    hash = this.url.substring(hashIndex, this.url.length);
                    this.url = this.url.substring(0, hashIndex);
                }

                // If the URL contains querystring bits, use them.
                // Otherwise, just create a set of valid params.
                if (this.url.indexOf('?') < 0) {
                    this.url += '?';
                } else {
                    this.url += '&';
                }

                // Append the initial width as a querystring parameter
                // and optional params if configured to do so
                this.iframe.src = this.url + 'initialWidth=' + width +
                                             '&childId=' + this.id;

                if (this.settings.optionalparams) {
                    this.iframe.src += '&parentTitle=' + encodeURIComponent(document.title);
                    this.iframe.src += '&'+ this.settings.parenturlparam + '=' + encodeURIComponent(this.settings.parenturlvalue);
                }
                this.iframe.src +=hash;

                // Set some attributes to this proto-iframe.
                this.iframe.setAttribute('width', '100%');
                this.iframe.setAttribute('scrolling', 'no');
                this.iframe.setAttribute('marginheight', '0');
                this.iframe.setAttribute('frameborder', '0');

                if (this.settings.title) {
                    this.iframe.setAttribute('title', this.settings.title);
                }

                if (this.settings.allowfullscreen !== undefined && this.settings.allowfullscreen !== false) {
                    this.iframe.setAttribute('allowfullscreen','');
                }

                if (this.settings.sandbox !== undefined && typeof this.settings.sandbox === 'string') {
                    this.iframe.setAttribute('sandbox', this.settings.sandbox);
                }

                if (this.settings.id) {
                    if (!document.getElementById(this.settings.id)) {
                        this.iframe.setAttribute('id', this.settings.id);
                    }
                }

                if (this.settings.name) {
                    this.iframe.setAttribute('name', this.settings.name);
                }

                // Replace the child content if needed
                // (some CMSs might strip out empty elements)
                while(this.el.firstChild) { this.el.removeChild(this.el.firstChild); }
                // Append the iframe to our element.
                this.el.appendChild(this.iframe);

                // Add an event listener that will handle redrawing the child on resize.
                window.addEventListener('resize', this._onResize);

                // Add an event listener that will send the child the viewport.
                if (this.settings.trackscroll) {
                    window.addEventListener('scroll', this._throttleOnScroll);
                }
            };

            /**
             * Send width on resize.
             *
             * @memberof module:pym.Parent
             * @method _onResize
             * @inner
             */
            this._onResize = function() {
                this.sendWidth();
                if (this.settings.trackscroll) {
                    this.sendViewportAndIFramePosition();
                }
            }.bind(this);

            /**
             * Send viewport and iframe info on scroll.
             *
             * @memberof module:pym.Parent
             * @method _onScroll
             * @inner
             */
            this._onScroll = function() {
                this.sendViewportAndIFramePosition();
            }.bind(this);

            /**
             * Fire all event handlers for a given message type.
             *
             * @memberof module:pym.Parent
             * @method _fire
             * @inner
             *
             * @param {String} messageType The type of message.
             * @param {String} message The message data.
             */
            this._fire = function(messageType, message) {
                if (messageType in this.messageHandlers) {
                    for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
                       this.messageHandlers[messageType][i].call(this, message);
                    }
                }
            };

            /**
             * Remove this parent from the page and unbind it's event handlers.
             *
             * @memberof module:pym.Parent
             * @method remove
             * @instance
             */
            this.remove = function() {
                window.removeEventListener('message', this._processMessage);
                window.removeEventListener('resize', this._onResize);

                this.el.removeChild(this.iframe);
                // _cleanAutoInitInstances in case this parent was autoInitialized
                _cleanAutoInitInstances();
            };

            /**
             * Process a new message from the child.
             *
             * @memberof module:pym.Parent
             * @method _processMessage
             * @inner
             *
             * @param {Event} e A message event.
             */
            this._processMessage = function(e) {
                // First, punt if this isn't from an acceptable xdomain.
                if (!_isSafeMessage(e, this.settings)) {
                    return;
                }

                // Discard object messages, we only care about strings
                if (typeof e.data !== 'string') {
                    return;
                }

                // Grab the message from the child and parse it.
                var match = e.data.match(this.messageRegex);

                // If there's no match or too many matches in the message, punt.
                if (!match || match.length !== 3) {
                    return false;
                }

                var messageType = match[1];
                var message = match[2];

                this._fire(messageType, message);
            }.bind(this);

            /**
             * Resize iframe in response to new height message from child.
             *
             * @memberof module:pym.Parent
             * @method _onHeightMessage
             * @inner
             *
             * @param {String} message The new height.
             */
            this._onHeightMessage = function(message) {
                /*
                 * Handle parent height message from child.
                 */
                var height = parseInt(message);

                this.iframe.setAttribute('height', height + 'px');
            };

            /**
             * Navigate parent to a new url.
             *
             * @memberof module:pym.Parent
             * @method _onNavigateToMessage
             * @inner
             *
             * @param {String} message The url to navigate to.
             */
            this._onNavigateToMessage = function(message) {
                /*
                 * Handle parent scroll message from child.
                 */
                 if (!_isSafeUrl(message)) {return;}
                document.location.href = message;
            };

            /**
             * Scroll parent to a given child position.
             *
             * @memberof module:pym.Parent
             * @method _onScrollToChildPosMessage
             * @inner
             *
             * @param {String} message The offset inside the child page.
             */
            this._onScrollToChildPosMessage = function(message) {
                // Get the child container position using getBoundingClientRect + pageYOffset
                // via https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
                var iframePos = document.getElementById(this.id).getBoundingClientRect().top + window.pageYOffset;

                var totalOffset = iframePos + parseInt(message);
                window.scrollTo(0, totalOffset);
            };

            /**
             * Bind a callback to a given messageType from the child.
             *
             * Reserved message names are: "height", "scrollTo" and "navigateTo".
             *
             * @memberof module:pym.Parent
             * @method onMessage
             * @instance
             *
             * @param {String} messageType The type of message being listened for.
             * @param {module:pym.Parent~onMessageCallback} callback The callback to invoke when a message of the given type is received.
             */
            this.onMessage = function(messageType, callback) {
                if (!(messageType in this.messageHandlers)) {
                    this.messageHandlers[messageType] = [];
                }

                this.messageHandlers[messageType].push(callback);
            };

            /**
             * @callback module:pym.Parent~onMessageCallback
             * @param {String} message The message data.
             */

            /**
             * Send a message to the the child.
             *
             * @memberof module:pym.Parent
             * @method sendMessage
             * @instance
             *
             * @param {String} messageType The type of message to send.
             * @param {String} message The message data to send.
             */
            this.sendMessage = function(messageType, message) {
                // When used alongside with pjax some references are lost
                if (this.el.getElementsByTagName('iframe').length) {
                    if (this.el.getElementsByTagName('iframe')[0].contentWindow) {
                        this.el.getElementsByTagName('iframe')[0].contentWindow
                            .postMessage(_makeMessage(this.id, messageType, message), '*');
                    }
                    else {
                        // Contentless child detected remove listeners and iframe
                        this.remove();
                    }
                }
            };

            /**
             * Transmit the current iframe width to the child.
             *
             * You shouldn't need to call this directly.
             *
             * @memberof module:pym.Parent
             * @method sendWidth
             * @instance
             */
            this.sendWidth = function() {
                var width = this.el.offsetWidth.toString();
                this.sendMessage('width', width);
            };

            /**
             * Transmit the current viewport and iframe position to the child.
             * Sends viewport width, viewport height
             * and iframe bounding rect top-left-bottom-right
             * all separated by spaces
             *
             * You shouldn't need to call this directly.
             *
             * @memberof module:pym.Parent
             * @method sendViewportAndIFramePosition
             * @instance
             */
            this.sendViewportAndIFramePosition = function() {
                var iframeRect = this.iframe.getBoundingClientRect();
                var vWidth   = window.innerWidth || document.documentElement.clientWidth;
                var vHeight  = window.innerHeight || document.documentElement.clientHeight;
                var payload = vWidth + ' ' + vHeight;
                payload += ' ' + iframeRect.top + ' ' + iframeRect.left;
                payload += ' ' + iframeRect.bottom + ' ' + iframeRect.right;
                this.sendMessage('viewport-iframe-position', payload);
            };

            // Add any overrides to settings coming from config.
            for (var key in config) {
                this.settings[key] = config[key];
            }

            /**
             * Throttled scroll function.
             *
             * @memberof module:pym.Parent
             * @method _throttleOnScroll
             * @inner
             */
            this._throttleOnScroll = _throttle(this._onScroll.bind(this), this.settings.scrollwait);

            // Bind required message handlers
            this.onMessage('height', this._onHeightMessage);
            this.onMessage('navigateTo', this._onNavigateToMessage);
            this.onMessage('scrollToChildPos', this._onScrollToChildPosMessage);
            this.onMessage('parentPositionInfo', this.sendViewportAndIFramePosition);

            // Add a listener for processing messages from the child.
            window.addEventListener('message', this._processMessage, false);

            // Construct the iframe in the container element.
            this._constructIframe();

            return this;
        };

        /**
         * The Child half of a responsive iframe.
         *
         * @memberof module:pym
         * @class Child
         * @param {Object} [config] Configuration for the child instance. sets {@link module:pym.Child~settings}
         * @param {function} [config.renderCallback=null] Callback invoked after receiving a resize event from the parent, sets {@link module:pym.Child#settings.renderCallback}
         * @param {string} [config.xdomain='*'] - xdomain to validate messages received
         * @param {number} [config.polling=0] - polling frequency in milliseconds to send height to parent
         * @param {number} [config.id] - parent container id used when navigating the child iframe to a new page but we want to keep it responsive.
         * @param {string} [config.parenturlparam] - if passed it will be override the default parentUrl query string parameter name expected on the iframe src
         */
        lib.Child = function(config) {
            /**
             * The initial width of the parent page
             *
             * @memberof module:pym.Child
             * @member {string} parentWidth
             * @inner
             */
            this.parentWidth = null;
            /**
             * The id of the parent container
             *
             * @memberof module:pym.Child
             * @member {String} id
             * @inner
             */
            this.id = null;
            /**
             * The title of the parent page from document.title.
             *
             * @memberof module:pym.Child
             * @member {String} parentTitle
             * @inner
             */
            this.parentTitle = null;
            /**
             * The URL of the parent page from window.location.href.
             *
             * @memberof module:pym.Child
             * @member {String} parentUrl
             * @inner
             */
            this.parentUrl = null;
            /**
             * The settings for the child instance. Can be overriden by passing a config object to the child constructor
             * i.e.: var pymChild = new pym.Child({renderCallback: render, xdomain: "\\*\.npr\.org"})
             *
             * @memberof module:pym.Child.settings
             * @member {Object} settings - default settings for the child instance
             * @inner
             */
            this.settings = {
                renderCallback: null,
                xdomain: '*',
                polling: 0,
                parenturlparam: 'parentUrl'
            };

            /**
             * The timerId in order to be able to stop when polling is enabled
             *
             * @memberof module:pym.Child
             * @member {String} timerId
             * @inner
             */
            this.timerId = null;
            /**
             * RegularExpression to validate the received messages
             *
             * @memberof module:pym.Child
             * @member {String} messageRegex
             * @inner
             */
            this.messageRegex = null;
            /**
             * Stores the registered messageHandlers for each messageType
             *
             * @memberof module:pym.Child
             * @member {Object} messageHandlers
             * @inner
             */
            this.messageHandlers = {};

            // Ensure a config object
            config = (config || {});

            /**
             * Bind a callback to a given messageType from the child.
             *
             * Reserved message names are: "width".
             *
             * @memberof module:pym.Child
             * @method onMessage
             * @instance
             *
             * @param {String} messageType The type of message being listened for.
             * @param {module:pym.Child~onMessageCallback} callback The callback to invoke when a message of the given type is received.
             */
            this.onMessage = function(messageType, callback) {

                if (!(messageType in this.messageHandlers)) {
                    this.messageHandlers[messageType] = [];
                }

                this.messageHandlers[messageType].push(callback);
            };

            /**
             * @callback module:pym.Child~onMessageCallback
             * @param {String} message The message data.
             */


            /**
             * Fire all event handlers for a given message type.
             *
             * @memberof module:pym.Child
             * @method _fire
             * @inner
             *
             * @param {String} messageType The type of message.
             * @param {String} message The message data.
             */
            this._fire = function(messageType, message) {
                /*
                 * Fire all event handlers for a given message type.
                 */
                if (messageType in this.messageHandlers) {
                    for (var i = 0; i < this.messageHandlers[messageType].length; i++) {
                       this.messageHandlers[messageType][i].call(this, message);
                    }
                }
            };

            /**
             * Process a new message from the parent.
             *
             * @memberof module:pym.Child
             * @method _processMessage
             * @inner
             *
             * @param {Event} e A message event.
             */
            this._processMessage = function(e) {
                /*
                * Process a new message from parent frame.
                */
                // First, punt if this isn't from an acceptable xdomain.
                if (!_isSafeMessage(e, this.settings)) {
                    return;
                }

                // Discard object messages, we only care about strings
                if (typeof e.data !== 'string') {
                    return;
                }

                // Get the message from the parent.
                var match = e.data.match(this.messageRegex);

                // If there's no match or it's a bad format, punt.
                if (!match || match.length !== 3) { return; }

                var messageType = match[1];
                var message = match[2];

                this._fire(messageType, message);
            }.bind(this);

            /**
             * Resize iframe in response to new width message from parent.
             *
             * @memberof module:pym.Child
             * @method _onWidthMessage
             * @inner
             *
             * @param {String} message The new width.
             */
            this._onWidthMessage = function(message) {
                /*
                 * Handle width message from the child.
                 */
                var width = parseInt(message);

                // Change the width if it's different.
                if (width !== this.parentWidth) {
                    this.parentWidth = width;

                    // Call the callback function if it exists.
                    if (this.settings.renderCallback) {
                        this.settings.renderCallback(width);
                    }

                    // Send the height back to the parent.
                    this.sendHeight();
                }
            };

            /**
             * Send a message to the the Parent.
             *
             * @memberof module:pym.Child
             * @method sendMessage
             * @instance
             *
             * @param {String} messageType The type of message to send.
             * @param {String} message The message data to send.
             */
            this.sendMessage = function(messageType, message) {
                /*
                 * Send a message to the parent.
                 */
                window.parent.postMessage(_makeMessage(this.id, messageType, message), '*');
            };

            /**
             * Transmit the current iframe height to the parent.
             *
             * Call this directly in cases where you manually alter the height of the iframe contents.
             *
             * @memberof module:pym.Child
             * @method sendHeight
             * @instance
             */
            this.sendHeight = function() {
                // Get the child's height.
                var height = document.getElementsByTagName('body')[0].offsetHeight.toString();

                // Send the height to the parent.
                this.sendMessage('height', height);

                return height;
            }.bind(this);

            /**
             * Ask parent to send the current viewport and iframe position information
             *
             * @memberof module:pym.Child
             * @method sendHeight
             * @instance
             */
            this.getParentPositionInfo = function() {
                // Send the height to the parent.
                this.sendMessage('parentPositionInfo');
            };

            /**
             * Scroll parent to a given element id.
             *
             * @memberof module:pym.Child
             * @method scrollParentTo
             * @instance
             *
             * @param {String} hash The id of the element to scroll to.
             */
            this.scrollParentTo = function(hash) {
                this.sendMessage('navigateTo', '#' + hash);
            };

            /**
             * Navigate parent to a given url.
             *
             * @memberof module:pym.Child
             * @method navigateParentTo
             * @instance
             *
             * @param {String} url The url to navigate to.
             */
            this.navigateParentTo = function(url) {
                this.sendMessage('navigateTo', url);
            };

            /**
             * Scroll parent to a given child element id.
             *
             * @memberof module:pym.Child
             * @method scrollParentToChildEl
             * @instance
             *
             * @param {String} id The id of the child element to scroll to.
             */
            this.scrollParentToChildEl = function(id) {
                // Get the child element position using getBoundingClientRect + pageYOffset
                // via https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
                var topPos = document.getElementById(id).getBoundingClientRect().top + window.pageYOffset;
                this.scrollParentToChildPos(topPos);
            };

            /**
             * Scroll parent to a particular child offset.
             *
             * @memberof module:pym.Child
             * @method scrollParentToChildPos
             * @instance
             *
             * @param {Number} pos The offset of the child element to scroll to.
             */
            this.scrollParentToChildPos = function(pos) {
                this.sendMessage('scrollToChildPos', pos.toString());
            };

            /**
             * Mark Whether the child is embedded or not
             * executes a callback in case it was passed to the config
             *
             * @memberof module:pym.Child
             * @method _markWhetherEmbedded
             * @inner
             *
             * @param {module:pym.Child~onMarkedEmbeddedStatus} The callback to execute after determining whether embedded or not.
             */
            var _markWhetherEmbedded = function(onMarkedEmbeddedStatus) {
              var htmlElement = document.getElementsByTagName('html')[0],
                  newClassForHtml,
                  originalHtmlClasses = htmlElement.className;
              try {
                if(window.self !== window.top) {
                  newClassForHtml = "embedded";
                }else {
                  newClassForHtml = "not-embedded";
                }
              }catch(e) {
                newClassForHtml = "embedded";
              }
              if(originalHtmlClasses.indexOf(newClassForHtml) < 0) {
                htmlElement.className = originalHtmlClasses ? originalHtmlClasses + ' ' + newClassForHtml : newClassForHtml;
                if(onMarkedEmbeddedStatus){
                  onMarkedEmbeddedStatus(newClassForHtml);
                }
                _raiseCustomEvent("marked-embedded");
              }
            };

            /**
             * @callback module:pym.Child~onMarkedEmbeddedStatus
             * @param {String} classname "embedded" or "not-embedded".
             */

            /**
             * Unbind child event handlers and timers.
             *
             * @memberof module:pym.Child
             * @method remove
             * @instance
             */
            this.remove = function() {
                window.removeEventListener('message', this._processMessage);
                if (this.timerId) {
                    clearInterval(this.timerId);
                }
            };

            // Initialize settings with overrides.
            for (var key in config) {
                this.settings[key] = config[key];
            }

            // Identify what ID the parent knows this child as.
            this.id = _getParameterByName('childId') || config.id;
            this.messageRegex = new RegExp('^pym' + MESSAGE_DELIMITER + this.id + MESSAGE_DELIMITER + '(\\S+)' + MESSAGE_DELIMITER + '(.*)$');

            // Get the initial width from a URL parameter.
            var width = parseInt(_getParameterByName('initialWidth'));

            // Get the url of the parent frame
            this.parentUrl = _getParameterByName(this.settings.parenturlparam);

            // Get the title of the parent frame
            this.parentTitle = _getParameterByName('parentTitle');

            // Bind the required message handlers
            this.onMessage('width', this._onWidthMessage);

            // Set up a listener to handle any incoming messages.
            window.addEventListener('message', this._processMessage, false);

            // If there's a callback function, call it.
            if (this.settings.renderCallback) {
                this.settings.renderCallback(width);
            }

            // Send the initial height to the parent.
            this.sendHeight();

            // If we're configured to poll, create a setInterval to handle that.
            if (this.settings.polling) {
                this.timerId = window.setInterval(this.sendHeight, this.settings.polling);
            }

            _markWhetherEmbedded(config.onMarkedEmbeddedStatus);

            return this;
        };

        // Initialize elements with pym data attributes
        // if we are not in server configuration
        if(typeof document !== "undefined") {
            lib.autoInit(true);
        }

        return lib;
    });
    });

    function groupBy(xs, key) {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    }

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

    // (46:12) {#if row.setlist}
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
    			attr_dev(a, "class", "svelte-1ffrfh6");
    			add_location(a, file, 45, 30, 1544);
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
    		source: "(46:12) {#if row.setlist}",
    		ctx
    	});

    	return block;
    }

    // (47:12) {#if row.public_url}
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
    			attr_dev(a, "class", "svelte-1ffrfh6");
    			add_location(a, file, 46, 33, 1627);
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
    		source: "(47:12) {#if row.public_url}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#each concert[1] as row, i}
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
    			attr_dev(h3, "class", "svelte-1ffrfh6");
    			add_location(h3, file, 42, 12, 1439);
    			attr_dev(div, "class", "band-content svelte-1ffrfh6");
    			add_location(div, file, 41, 10, 1400);
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
    		source: "(41:8) {#each concert[1] as row, i}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#each filteredGroupedConcerts as concert, i}
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
    			attr_dev(div0, "class", "show-content svelte-1ffrfh6");
    			add_location(div0, file, 50, 8, 1743);
    			attr_dev(div1, "class", "concert-cell svelte-1ffrfh6");
    			add_location(div1, file, 39, 6, 1326);
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
    		source: "(39:4) {#each filteredGroupedConcerts as concert, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let t0;
    	let span0;
    	let t2;
    	let div1;
    	let div0;
    	let p;
    	let span1;
    	let t3;
    	let em0;
    	let t5;
    	let t6;
    	let span2;
    	let t7;
    	let em1;
    	let t9;
    	let t10;
    	let main;
    	let div2;
    	let input;
    	let t11;
    	let div3;
    	let mounted;
    	let dispose;
    	let each_value = /*filteredGroupedConcerts*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text("concert");
    			span0 = element("span");
    			span0.textContent = ".log";
    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			span1 = element("span");
    			t3 = text(" 📄");
    			em0 = element("em");
    			em0.textContent = "Setlist";
    			t5 = text(" ");
    			t6 = space();
    			span2 = element("span");
    			t7 = text(" 📷");
    			em1 = element("em");
    			em1.textContent = "Photos/video";
    			t9 = text(" ");
    			t10 = space();
    			main = element("main");
    			div2 = element("div");
    			input = element("input");
    			t11 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "svelte-1ffrfh6");
    			add_location(span0, file, 22, 13, 535);
    			attr_dev(h1, "class", "svelte-1ffrfh6");
    			add_location(h1, file, 22, 2, 524);
    			attr_dev(header, "class", "svelte-1ffrfh6");
    			add_location(header, file, 21, 0, 513);
    			attr_dev(em0, "class", "svelte-1ffrfh6");
    			add_location(em0, file, 26, 21, 638);
    			attr_dev(span1, "class", "svelte-1ffrfh6");
    			add_location(span1, file, 26, 7, 624);
    			attr_dev(em1, "class", "svelte-1ffrfh6");
    			add_location(em1, file, 26, 66, 683);
    			attr_dev(span2, "class", "svelte-1ffrfh6");
    			add_location(span2, file, 26, 52, 669);
    			add_location(p, file, 26, 4, 621);
    			attr_dev(div0, "class", "instructions");
    			add_location(div0, file, 25, 2, 590);
    			attr_dev(div1, "class", "intro svelte-1ffrfh6");
    			add_location(div1, file, 24, 0, 568);
    			attr_dev(input, "placeholder", "Search a band name...");
    			attr_dev(input, "class", "svelte-1ffrfh6");
    			add_location(input, file, 35, 4, 1170);
    			attr_dev(div2, "class", "input-wrapper svelte-1ffrfh6");
    			add_location(div2, file, 34, 2, 1138);
    			attr_dev(div3, "id", "concerts");
    			attr_dev(div3, "class", "svelte-1ffrfh6");
    			add_location(div3, file, 37, 2, 1250);
    			add_location(main, file, 33, 0, 1129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, span1);
    			append_dev(span1, t3);
    			append_dev(span1, em0);
    			append_dev(span1, t5);
    			append_dev(p, t6);
    			append_dev(p, span2);
    			append_dev(span2, t7);
    			append_dev(span2, em1);
    			append_dev(span2, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*searchTerm*/ ctx[0]);
    			append_dev(main, t11);
    			append_dev(main, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[2]);
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
    						each_blocks[i].m(div3, null);
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
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
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
    	new pym_v1.Child({ polling: 500 });
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
    		concerts,
    		pym: pym_v1,
    		groupBy,
    		groupedConcerts,
    		searchTerm,
    		filteredGroupedConcerts
    	});

    	$$self.$inject_state = $$props => {
    		if ("groupedConcerts" in $$props) $$invalidate(3, groupedConcerts = $$props.groupedConcerts);
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

    	return [searchTerm, filteredGroupedConcerts, input_input_handler];
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
