import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import Changeset from 'ember-changeset';

module('Acceptance | main', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    // for backwards compatibility with pre 3.0 versions of ember
    let container = this.owner || this.application.__container__;
    this.store = container.lookup('service:store');

    run(() => {
      let profile = this.store.createRecord('profile');
      let user = this.store.createRecord('user', { profile });
      this.dummyUser = user;

      return user.get('dogs').then(() => {
        for (let i = 0; i < 2; i++) {
          user.get('dogs').addObject(this.store.createRecord('dog'))
        }
      });
    });
  });

  test('it works for belongsTo', function(assert) {
    let user = this.dummyUser;
    let changeset = new Changeset(user);

    run(() => {
      assert.equal(changeset.get('profile'), user.get('profile'));
      assert.equal(changeset.get('profile.firstName'), user.get('profile.firstName'));
      assert.equal(changeset.get('profile.lastName'), user.get('profile.lastName'));

      changeset.set('profile.firstName', 'Grace');
      changeset.set('profile.lastName', 'Hopper');

      assert.equal(changeset.get('profile.firstName'), 'Grace');
      assert.equal(changeset.get('profile.lastName'), 'Hopper');

      changeset.execute();

      assert.equal(user.get('profile.firstName'), 'Grace');
      assert.equal(user.get('profile.lastName'), 'Hopper');

      let profile = this.store.createRecord('profile', { firstName: 'Terry', lastName: 'Bubblewinkles' });
      changeset.set('profile', profile);

      assert.equal(changeset.get('profile').get('firstName'), 'Terry');
      assert.equal(changeset.get('profile.firstName'), 'Terry');
      assert.equal(changeset.get('profile.lastName'), 'Bubblewinkles');

      changeset.execute();

      assert.equal(user.get('profile.firstName'), 'Terry');
      assert.equal(user.get('profile.lastName'), 'Bubblewinkles');
    })
  });

  test('it works for hasMany / firstObject', function(assert) {
    let user = this.dummyUser;

    let changeset = new Changeset(user);
    run(() => {
      let newDog = this.store.createRecord('dog', { breed: 'Münsterländer' });
      let dogs = changeset.get('dogs');
      dogs.pushObjects([newDog]);
    });

    let dogs = changeset.get('dogs').toArray();
    assert.equal(dogs[0].get('breed'), 'rough collie');
    assert.equal(dogs[1].get('breed'), 'rough collie');
    assert.equal(dogs[2].get('breed'), 'Münsterländer');

    changeset.execute();
    dogs = user.get('dogs').toArray();
    assert.equal(dogs[0].get('breed'), 'rough collie');
    assert.equal(dogs[1].get('breed'), 'rough collie');
    assert.equal(dogs[2].get('breed'), 'Münsterländer');
  });
});
