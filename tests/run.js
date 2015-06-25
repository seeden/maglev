import should from "should";
import Server from '../dist/server';
import mongoose from 'mongoose';
import request from 'supertest';

describe('Run server', function() {
	var server = null;

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
			favicon: false
		}, function(err, server) {
			if(err) {
				throw err;
			}

			server.listen(done);
		});	
	});

	it('should be able to get value from route', function(done) {
		var uri = '/api/test';

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
		var Article = server.models.Article;
		Article.create({
			title: 'Book name'
		}, function(err, article) {
			if(err) {
				throw err;
			}

			article.title.should.equal('Book name');

			done();
		});
	});	

	it('should be able to close server', function(done) {
		server.close(done);
	});
});	
