
CREATE TABLE IF NOT EXISTS `puntuacion` (
  `Id_mural` int(8) NOT NULL,
  `Id_usuario` int(4) NOT NULL,
  `estrellas` tinyint(1) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`Id_mural`,`Id_usuario`),
  KEY `Id_usuario` (`Id_usuario`),
  CONSTRAINT `puntuacion_ibfk_1` FOREIGN KEY (`Id_mural`) REFERENCES `mural` (`Id_mural`),
  CONSTRAINT `puntuacion_ibfk_2` FOREIGN KEY (`Id_usuario`) REFERENCES `usuario` (`Id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


UPDATE `mural` SET `cantidad_puntuacion` = 0, `estrellas` = 0;
