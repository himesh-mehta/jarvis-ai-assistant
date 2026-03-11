/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/login` | `/login`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/register` | `/register`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/chat` | `/chat`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/core` | `/core`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(auth)'}/login` | `/login`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(auth)'}/register` | `/register`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/chat` | `/chat`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/core` | `/core`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(auth)'}/login${`?${string}` | `#${string}` | ''}` | `/login${`?${string}` | `#${string}` | ''}` | `${'/(auth)'}/register${`?${string}` | `#${string}` | ''}` | `/register${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/chat${`?${string}` | `#${string}` | ''}` | `/chat${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/core${`?${string}` | `#${string}` | ''}` | `/core${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/login` | `/login`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/register` | `/register`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/chat` | `/chat`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/core` | `/core`; params?: Router.UnknownInputParams; };
    }
  }
}
