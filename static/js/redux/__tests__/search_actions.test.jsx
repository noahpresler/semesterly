import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import nock from 'nock';
import rootReducer from '../reducers/root_reducer';
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
      rootReducer,
      { userInfo: loggedIn, timetables: withTimetables, semester: sampleSemesters, entities },
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
      rootReducer,
      { semester: sampleSemesters },
      applyMiddleware(thunkMiddleware),
    );
    store.dispatch(maybeSetSemester(1));
    expect(store.getState().semester.current).toEqual(1);
  });

  it('does not switch for anonymous user with timetables', () => {
    const store = createStore(
      rootReducer,
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
