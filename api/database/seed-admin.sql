-- Crea un administrador de desarrollo para entrar a la web de Kaffehaus.
-- Correo: admin@kaffehaus.bo   Contraseña: Kaffehaus2026!
-- Se puede ejecutar varias veces: no duplica nada.
-- Solo para desarrollo local: cambie la contraseña desde la app antes de usar datos reales.

INSERT INTO rol (nombre)
SELECT 'Administrador'
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE nombre = 'Administrador' AND borrado = FALSE);

WITH p AS (
  INSERT INTO persona (nombre, apellidos, telefono, dni)
  SELECT 'Admin', 'Kaffehaus', '70000000', '0000000'
  WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE correo = 'admin@kaffehaus.bo')
  RETURNING id
)
INSERT INTO usuario (id_persona, correo, contrasena, id_rol)
SELECT p.id, 'admin@kaffehaus.bo', 'pbkdf2$210000$mYm0OS7S0jVtwvQyjhDEhw==$fdiAd+hnQyEl0kQD7/9Yn06hEqhWfW3RlxPcdXpQayc=',
       (SELECT id FROM rol WHERE nombre = 'Administrador' AND borrado = FALSE ORDER BY fec_c LIMIT 1)
FROM p;

SELECT u.correo, r.nombre AS rol FROM usuario u JOIN rol r ON r.id = u.id_rol WHERE u.correo = 'admin@kaffehaus.bo';
