import should from 'should';
import Server from '../src/server';
import mongoose from 'mongoose';
import request from 'supertest';

describe('Run server', function() {
  let server = null;

  it('should be able to run simple server', function(done) {
    server = new Server({
      root: __dirname,
      db: mongoose.connect('mongodb://localhost/maglev'),
      session: {
        secret: '123456789'
      },
      server: {
        port: 4433
      },
      //favicon: false,
      //robots: false
    }, function(err, server) {
      if (err) {
        throw err;
      }

      server.listen(done);
    });
  });

  it('should not be able to listen again', function(done) {
    server.listen(function(err) {
      err.message.should.equal('Server is already listening');
      done();
    });
  });

  it('should be able to get value from route', function(done) {
    const uri = '/api/test';

    request('http://localhost:4433')
      .get(uri)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(204)
      .end(function(err, res) {
        done();
      });
  });

  it('should be able to get module', function(done) {
    const Article = server.models.Article;
    Article.create({
      title: 'Book name'
    }, function(err, article) {
      if (err) {
        throw err;
      }

      article.title.should.equal('Book name');

      done();
    });
  });

  it('should be able to handle error', function(done) {
    const uri = '/api/test/error';

    request('http://localhost:4433')
      .get(uri)
      .set('Accept', 'application/json')
      .expect(500)
      .end(function(err, res) {
        done();
      });
  });

  it('should be able to close server', function(done) {
    server.close(function(err) {
      if (err) {
        throw err;
      }

      done();
    });
  });

  it('should not be able to close server again', function(done) {
    server.close(function(err) {
      err.message.should.equal('Server is not listening');
      done();
    });
  });

  let userSaved = null;

  it('should be able to create user', function(done) {
    const User = server.models.User;
    User.create({
      firstName: 'Zlatko',
      lastName: 'Fedor'
    }, function(err, user) {
      if (err) {
        throw err;
      }

      user.firstName.should.equal('Zlatko');
      user.lastName.should.equal('Fedor');
      user.name.should.equal('Zlatko Fedor');

      userSaved = user;

      done();
    });
  });

  it('should be able to add facebook provider', function(done) {
    userSaved.addProvider('facebook', 12345, {}, function(err, provider) {
      if (err) {
        throw err;
      }

      provider.user.toString().should.equal(userSaved._id.toString());
      provider.nameUID.should.equal('facebook_12345');

      done();
    });
  });

  it('should be able to find user by facebook id', function(done) {
    const User = server.models.User;
    User.findByFacebookID(12345, function(err, user) {
      if (err) {
        throw err;
      }

      user.firstName.should.equal('Zlatko');
      user.lastName.should.equal('Fedor');
      user.name.should.equal('Zlatko Fedor');

      done();
    });
  });

  it('should be able to get provider', function(done) {
    userSaved.getProvider('facebook', 12345, function(err, provider) {
      if (err) {
        throw err;
      }

      provider.user.toString().should.equal(userSaved._id.toString());
      provider.nameUID.should.equal('facebook_12345');

      done();
    });
  });

  it('should be able to use function hasProvider', function(done) {
    userSaved.hasProvider('facebook', 12345, function(err, has) {
      if (err) {
        throw err;
      }

      has.should.equal(true);

      done();
    });
  });

  it('should be able to use function hasProvider', function(done) {
    userSaved.hasProvider('facebook', function(err, has) {
      if (err) {
        throw err;
      }

      has.should.equal(true);

      done();
    });
  });

  it('should be able to use function hasProvider', function(done) {
    userSaved.hasProvider('facebook', 1234566666, function(err, has) {
      if (err) {
        throw err;
      }

      has.should.equal(false);

      done();
    });
  });

  it('should be able to use function hasProvider', function(done) {
    userSaved.hasProvider('twitter', function(err, has) {
      if (err) {
        throw err;
      }

      has.should.equal(false);

      done();
    });
  });

  it('should be able to use removeProvider', function(done) {
    userSaved.removeProvider('facebook', 12345, function(err) {
      if (err) {
        throw err;
      }

      done();
    });
  });

  it('should be able to use function hasProvider', function(done) {
    userSaved.hasProvider('facebook', 12345, function(err, has) {
      if (err) {
        throw err;
      }

      has.should.equal(false);

      done();
    });
  });

  it('should be able to create by facebook profile', function(done) {
    const User = server.models.User;
    User.createByFacebook({
      id: 44444,
      name: 'Zlatko Fedor',
      first_name: 'Zlatko',
      last_name: 'Fedor',
      email: 'fb@fb.com'
    }, function(err, user) {
      if (err) {
        throw err;
      }

      user.firstName.should.equal('Zlatko');
      user.lastName.should.equal('Fedor');
      user.name.should.equal('Zlatko Fedor');
      user.email.should.equal('fb@fb.com');

      userSaved = user;

      done();
    });
  });

   it('should be able to use function hasProvider', function(done) {
    userSaved.hasProvider('facebook', 44444, function(err, has) {
      if (err) {
        throw err;
      }

      has.should.equal(true);

      done();
    });
  });


  it('should be able to clean all', function(done) {
    const { User, Provider } = server.models;
    User.remove({}, function(err) {
      if (err) {
        throw err;
      }

      Provider.remove({}, function(err) {
        if (err) {
          throw err;
        }

        done();
      });
    });
  });
});
