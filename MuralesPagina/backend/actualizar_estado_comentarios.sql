
USE murales;


ALTER TABLE `comentario` ADD COLUMN `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE `comentario` SET `fecha` = STR_TO_DATE(`publicado`, '%Y-%m-%d %H:%i') WHERE `publicado` REGEXP '^[0-9]{4}-';

UPDATE `comentario` SET `publicado` = CASE `aprobado`
    WHEN 1 THEN 'publicado'
    WHEN 2 THEN 'rechazado'
    ELSE 'para revisar' END;


ALTER TABLE `comentario`
  MODIFY `publicado` enum('rechazado','publicado','para revisar') NOT NULL DEFAULT 'para revisar',
  DROP COLUMN `aprobado`;
