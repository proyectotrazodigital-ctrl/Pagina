
INSERT IGNORE INTO `crea` (`Id_mural`, `Id_autor`)
SELECT m.`Id_mural`, a.`id_autor`
FROM `mural` m
JOIN `autor` a
  ON TRIM(m.`autor`) = TRIM(CONCAT_WS(' ', a.`Nombre`, a.`Apellido`))
  OR ((a.`Apellido` IS NULL OR TRIM(a.`Apellido`) = '') AND TRIM(m.`autor`) = TRIM(a.`Nombre`));
