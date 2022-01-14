import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import nock from 'nock';
import reducers from '../reducers';
import { maybeSetSemester } from '../actions/search_actions';
import {
  loggedIn,
  timetable,
  withTimetables,
  sampleSemesters,
  entities,
} from '../__fixtures__/state';


describe('maybeSetSemester', () => {
  const backend = nock('https://localhost')
    .defaultReplyHeaders({ 'Content-Type': 'application/json' });

  it('switches for logged in user', () => {
    const store = createStore(
      combineReducers(reducers),
      {
        userInfo: loggedIn,
        timetables: withTimetables,
        semester: sampleSemesters,
        entities,
      },
      applyMiddleware(thunkMiddleware),
    );

    const newSemester = 1;
    const { name, year } = sampleSemesters.all[newSemester];

    backend
      .post('/user/timetables/', () => true)
      .reply(201, {
        saved_timetable: timetable,
        timetables: [timetable],
      });

    backend
      .get(`/user/timetables/${name}/${year}/`)
      .reply(200, { timetables: [], courses: [] });

    return store.dispatch(maybeSetSemester(1)).then(() => {
      expect(store.getState().semester.current).toEqual(newSemester);
    });
  });

  it('switches for anonymous user without timetables', () => {
    const store = createStore(
      combineReducers(reducers),
      { semester: sampleSemesters },
      applyMiddleware(thunkMiddleware),
    );
    store.dispatch(maybeSetSemester(1));
    expect(store.getState().semester.current).toEqual(1);
  });

  it('does not switch for anonymous user with timetables', () => {
    const store = createStore(
      combineReducers(reducers),
      { semester: sampleSemesters, timetables: withTimetables, entities },
      applyMiddleware(thunkMiddleware),
    );
    store.dispatch(maybeSetSemester(1));
    const newState = store.getState();
    expect(newState.alerts.alertChangeSemester).toEqual(true);
    expect(newState.alerts.desiredSemester).toEqual(1);
    expect(newState.semester.current).toEqual(0);
  });
});
