import { Controller, Get, Post, Body } from '@nestjs/common';
import { FaqService } from '../service/faq.service';
import { CreateFaqDto } from '../dto/create-faq.dto';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  postFaq(@Body() dto: CreateFaqDto) {
    return this.faqService.postFaq(dto);
  }

  @Get()
  getFaqs() {
    return this.faqService.getFaqs();
  }
}
