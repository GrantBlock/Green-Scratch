/** The design system's components arrive on window.BlockConcepts (see design/system/components/bundle.js). */
import type * as T from '../../../../design/system/components/index.d.ts';
import type { ReactElement } from 'react';

type C<P> = (props: P) => ReactElement | null;

export interface DesignSystem {
  Wordmark: C<T.WordmarkProps>;
  Button: C<T.ButtonProps>;
  NavBar: C<T.NavBarProps>;
  Footer: C<T.FooterProps>;
  TextField: C<T.TextFieldProps>;
  TextArea: C<T.TextAreaProps>;
  FileDrop: C<T.FileDropProps>;
  SearchField: C<T.SearchFieldProps>;
  TabBar: C<T.TabBarProps>;
  ListBox: C<T.ListBoxProps>;
  ButtonColumn: C<T.ButtonColumnProps>;
  DetailPane: C<T.DetailPaneProps>;
  GrabLayout: C<T.GrabLayoutProps>;
  FixLayout: C<T.FixLayoutProps>;
  StateMessage: C<T.StateMessageProps>;
  Toast: C<T.ToastProps>;
}

declare global {
  interface Window { BlockConcepts: DesignSystem }
}
