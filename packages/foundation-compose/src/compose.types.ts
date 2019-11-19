import {
  IRenderData,
  IComposableDefinition,
  ISlotWithFilter,
  IComposableType,
  IExtractSlotProps,
  IExtractProps
} from '@uifabricshared/foundation-composable';
import { ISlotProps, IComponentSettings, IOverrideLookup } from '@uifabricshared/foundation-settings';
import { ISettingsEntry } from '@uifabricshared/themed-settings';
import { ITheme } from '@uifabricshared/theming-ramp';
import { ISlotStyleFactories, IComponentTokens } from '@uifabricshared/foundation-tokens';
import * as React from 'react';

export interface IComposeType<
  TProps extends object = object,
  TSlotProps extends ISlotProps = ISlotProps<TProps>,
  TState extends object = object,
  TTokens extends object = object,
  TStatics extends object = object
> extends IComposableType<TProps, TSlotProps, TState> {
  /**
   * Any statics to attach to the component
   */
  statics: TStatics;

  /**
   * Token props for this component
   */
  tokens: TTokens;
}

// extract statics type from IComposeType
type IStaticsFragment<TStatics extends object> = { statics: TStatics };
export type IExtractStatics<T> = T extends IStaticsFragment<infer U> ? U : object;

// extract tokens type from IComposeType
type ITokensFragment<TTokens extends object> = { tokens: TTokens };
export type IExtractTokens<T> = T extends ITokensFragment<infer U> ? U : object;
export type IWithTokens<T, TTokens extends object> = T & { tokens?: TTokens };

/**
 * Function signature for useStyling as implemented by compose.  This adds the lookup function to enable
 * more control over how overrides are applied.
 */
export type IDefineUseComposeStyling<TProps, TSlotProps extends ISlotProps, TTokens extends object> = (
  props: TProps,
  lookup?: IOverrideLookup
) => IWithTokens<TSlotProps, TTokens>;
export type IUseComposeStyling<T> = IDefineUseComposeStyling<IExtractProps<T>, IExtractSlotProps<T>, IExtractTokens<T>>;

/**
 * Array of:
 *  IComponentSettings for the component
 *  string - name of the entry to query in the theme
 *  `theme => IComponentSettings` function
 *
 * These settings are layered together in order to produce the merged settings for a component
 */
export type IDefineComposeSettings<TSlotProps extends ISlotProps, TTokens extends object> = ISettingsEntry<
  IComponentSettings<IWithTokens<TSlotProps, TTokens>>,
  ITheme
>[];
export type IComposeSettings<T> = IDefineComposeSettings<IExtractSlotProps<T>, IExtractTokens<T>>;

/**
 * Settings which dictate the behavior of useStyling, as implemented by the compose package.  These are
 * separated from IComponentOptions to allow the styling portion to be used independently if so desired.
 */
export interface IStylingSettings<TSlotProps extends ISlotProps, TTokens extends object> {
  /**
   * slots of IComposable with added style factory options
   */
  slots: { [K in keyof TSlotProps]: ISlotWithFilter<ISlotStyleFactories<TSlotProps[K], TTokens, ITheme>> };

  /**
   * settings used to build up the style definitions
   */
  settings?: IDefineComposeSettings<TSlotProps, TTokens>;

  /**
   * The input tokens processed, built into functions, with the keys built into a map.
   *
   * This gets set automatically when the component is set up for the first time and should not be set by hand.
   */
  resolvedTokens?: IComponentTokens<TSlotProps, TTokens, ITheme>;
}

/**
 * Options to be used with compose.  These drive the actual behavior of the component and are comprised of styling
 * options as well as options which configure composable.
 */
export interface IComposeOptions<
  TProps extends object = object,
  TSlotProps extends ISlotProps = ISlotProps<TProps>,
  TTokens extends object = object,
  TState extends object = object,
  TStatics extends object = object
> extends Omit<IComposableDefinition<TProps, TSlotProps, TState>, 'slots'>, IStylingSettings<TSlotProps, TTokens> {
  /**
   * Add an additional option to use styling to allow for injecting override lookup functions
   */
  useStyling?: IDefineUseComposeStyling<TProps, TSlotProps, TTokens>;

  /**
   * Use prepare props will take the more opinionated version of useStyling
   */
  usePrepareProps?: (props: TProps, useStyling: IDefineUseComposeStyling<TProps, TSlotProps, TTokens>) => IRenderData<TSlotProps, TState>;

  /**
   * Optional statics to attach to the component.  This is primary used to attach a sub-component to a parent component
   */
  statics?: TStatics;
}

/**
 * The signature of the component returned from compose.
 */
export type IComposeReturnType<
  TProps extends object,
  TSlotProps extends ISlotProps,
  TTokens extends object,
  TState extends object = object,
  TStatics extends object = object
> = React.FunctionComponent<TProps> &
  TStatics & {
    /**
     * composable options, used by composable for chaining objects.  For compose this also includes the extensions
     * such as settings or token information.
     */
    __composable: IComposeOptions<TProps, TSlotProps, TTokens, TState, TStatics>;

    /**
     * shorthand function for doing quick customizations of a component by appending to settings
     */
    customize: (
      ...settings: IDefineComposeSettings<TSlotProps, TTokens>
    ) => IComposeReturnType<TProps, TSlotProps, TTokens, TState, TStatics>;

    /**
     * helper function to quickly add new partial options to the base component.  The primary advantage is that
     * this is strongly typed for the component type which avoids needing to pass all the type parameters correctly.
     */
    compose: (
      newOptions: Partial<IComposeOptions<TProps, TSlotProps, TTokens, TState, TStatics>>
    ) => IComposeReturnType<TProps, TSlotProps, TTokens, TState, TStatics>;
  };