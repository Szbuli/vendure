import { Type } from '@vendure/common/lib/shared-types';
import { unique } from '@vendure/common/lib/unique';
import { Connection, OrderByCondition } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

import { UserInputError } from '../../../common/error/errors';
import { NullOptionals, SortParameter } from '../../../common/types/common-types';
import { VendureEntity } from '../../../entity/base/base.entity';

/**
 * Parses the provided SortParameter array against the metadata of the given entity, ensuring that only
 * valid fields are being sorted against. The output assumes
 * @param connection
 * @param entity
 * @param sortParams
 */
export function parseSortParams<T extends VendureEntity>(
    connection: Connection,
    entity: Type<T>,
    sortParams?: NullOptionals<SortParameter<T>> | null,
): OrderByCondition {
    if (!sortParams || Object.keys(sortParams).length === 0) {
        return {};
    }

    const metadata = connection.getMetadata(entity);
    const columns = metadata.columns;
    let translationColumns: ColumnMetadata[] = [];
    const relations = metadata.relations;

    const translationRelation = relations.find(r => r.propertyName === 'translations');
    if (translationRelation) {
        const translationMetadata = connection.getMetadata(translationRelation.type);
        translationColumns = columns.concat(translationMetadata.columns.filter(c => !c.relationMetadata));
    }

    const output: OrderByCondition = {};
    const alias = metadata.name.toLowerCase();

    for (const [key, order] of Object.entries(sortParams)) {
        if (columns.find(c => c.propertyName === key)) {
            output[`${alias}.${key}`] = order as any;
        } else if (translationColumns.find(c => c.propertyName === key)) {
            output[`${alias}_translations.${key}`] = order as any;
        } else {
            throw new UserInputError('error.invalid-sort-field', {
                fieldName: key,
                validFields: getValidSortFields([...columns, ...translationColumns]),
            });
        }
    }
    return output;
}

function getValidSortFields(columns: ColumnMetadata[]): string {
    return unique(columns.map(c => c.propertyName)).join(', ');
}
