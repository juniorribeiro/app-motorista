
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Obter o token do header
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Autenticação falhou: Token não fornecido' });
    }

    // Verificar token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Autenticação falhou: Token inválido' });
  }
};
