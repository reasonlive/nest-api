import { Injectable } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';
import { DataSource } from 'typeorm';
import { Article } from '../articles/entities/article.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  public constructor(
    private dataSource: DataSource
  ) {
  }

  public async seed(): Promise<void> {

    await this.dataSource.transaction(async (manager) => {
      const user: User = await manager.save(User, {
        email: 'user@example.com',
        password: await bcrypt.hash('password', 12),
        firstName: 'John',
        lastName: 'Smith'
      })

      await manager.save(Article, {
        title: 'Hello1',
        description: 'This is description',
        content: 'Some content for the article',
        author: user
      })

      await manager.save(Article, {
        title: 'Hello2',
        description: 'This is description',
        content: 'Some content for the article',
        author: user
      })

      await manager.save(Article, {
        title: 'Hello3',
        description: 'This is description',
        content: 'Some content for the article',
        author: user
      })
    })
  }
}
