import { V as ViteReactSSGContext, d as RouterOptions, a as ViteReactSSGClientOptions } from './shared/vite-react-ssg.B2xAADcy.js';
export { C as CrittersOptions, I as IndexRouteRecord, N as NonIndexRouteRecord, R as RouteRecord, c as RouterFutureConfig, S as StyleCollector, b as ViteReactSSGOptions } from './shared/vite-react-ssg.B2xAADcy.js';
export { C as ClientOnly, H as Head } from './shared/vite-react-ssg.-NlgsPvg.js';
import { LinkProps, NavLinkProps } from 'react-router-dom';
import React from 'react';
import 'beasties';
import 'react-helmet-async';

/**
 * @deprecated Please use `Link` from 'react-router-dom' instead.
 */
declare const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
/**
 * @deprecated Please use `NavLink` from 'react-router-dom' instead.
 */
declare const NavLink: React.ForwardRefExoticComponent<NavLinkProps & React.RefAttributes<HTMLAnchorElement>>;

declare function ViteReactSSG(routerOptions: RouterOptions, fn?: (context: ViteReactSSGContext<true>) => Promise<void> | void, options?: ViteReactSSGClientOptions): (client?: boolean, routePath?: string) => Promise<ViteReactSSGContext<true>>;
declare global {
    interface Window {
        __VITE_REACT_SSG_STATIC_LOADER_DATA__: any;
        __VITE_REACT_SSG_HASH__: string;
        __VITE_REACT_SSG_CONTEXT__: ViteReactSSGContext<true>;
    }
}

export { Link, NavLink, RouterOptions, ViteReactSSG, ViteReactSSGClientOptions, ViteReactSSGContext };
