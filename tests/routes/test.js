export default function(route) {
  route
    .api()
    .route('/test')
      .get('/', function(req, res, next) {
        res.status(204).jsonp({});
      })
      .get('/error', function(req, res, next) {
        throw new Error('I am error');
      });
}
