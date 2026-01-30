import { Injectable } from '@nestjs/common';
import { CreateFaqDto } from '../dto/create-faq.dto';

export interface Faq {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

@Injectable()
export class FaqService {
  private faqs: Faq[] = [];
  private idSeq = 1;

  postFaq(dto: CreateFaqDto): Promise<{ faq: Faq }> {
    const faq: Faq = {
      id: this.idSeq++,
      name: dto.name,
      email: dto.email,
      message: dto.message,
      createdAt: new Date(),
    };
    this.faqs.unshift(faq);
    return Promise.resolve({ faq });
  }

  getFaqs(): Promise<Faq[]> {
    return Promise.resolve(this.faqs);
  }
}
