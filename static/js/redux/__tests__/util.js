import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from '../reducers/root_reducer';

export const getInitialState = function getInitialReduxState() {
  const store = createStore(
    rootReducer,
    applyMiddleware(thunkMiddleware)
  );

  return store.getState();
};
