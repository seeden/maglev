export default function (route) {
  route
    .api()
    .route('/test')
      .get('/', (req, res) => {
        res.status(204).jsonp({});
      })
      .get('/error', () => {
        throw new Error('I am error');
      });
}
