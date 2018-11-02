import { DeepPartial } from 'shared/shared-types';
import { Column, Entity } from 'typeorm';

import { PaymentState } from '../../service/helpers/payment-state-machine/payment-state';
import { VendureEntity } from '../base/base.entity';

export type PaymentMetadata = { [key: string]: string | number | boolean };

@Entity()
export class Payment extends VendureEntity {
    constructor(input?: DeepPartial<Payment>) {
        super(input);
    }

    @Column() method: string;

    @Column() amount: number;

    @Column('varchar') state: PaymentState;

    @Column({ nullable: true })
    transactionId: string;

    @Column('simple-json') metadata: PaymentMetadata;
}
