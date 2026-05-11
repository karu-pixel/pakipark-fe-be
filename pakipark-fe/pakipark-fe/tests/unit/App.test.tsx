import { Children, isValidElement } from 'react';

import App from '../../src/bootstrap/App';
import { AuthScreen } from '../../src/features/auth/screens/AuthScreen';

describe('App', () => {
  it('renders a status bar and auth screen', () => {
    const element = App();

    expect(isValidElement(element)).toBe(true);

    const children = Children.toArray(element.props.children).filter(isValidElement);
    expect(children).toHaveLength(2);

    const auth = children[1];
    expect(auth.type).toBe(AuthScreen);
  });
});
